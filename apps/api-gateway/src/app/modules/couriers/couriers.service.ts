import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RedisService } from '@vexa/core';
import {
  CourierLocationEvent,
  CourierStatus,
  GeoPoint,
  JobStatus,
  MatchingDefaults,
  RedisChannels,
} from '@vexa/shared';
import { JobEntity } from '../jobs/job.entity';
import { CourierEntity } from './courier.entity';
import { PayoutEntity, PayoutStatus } from './payout.entity';
import {
  CreatePayoutDto,
  RegisterCourierDto,
  SubmitVerificationDto,
  UpdateCourierLocationDto,
  UpdateVehicleDetailsDto,
} from './dto';

@Injectable()
export class CouriersService {
  constructor(
    @InjectRepository(CourierEntity)
    private readonly repo: Repository<CourierEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(PayoutEntity)
    private readonly payouts: Repository<PayoutEntity>,
    private readonly redis: RedisService
  ) {}

  findAll() {
    return this.repo.find({ relations: { user: true }, order: { createdAt: 'DESC' } });
  }

  async getById(id: string) {
    const courier = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!courier) throw new NotFoundException(`Courier ${id} not found`);
    return courier;
  }

  async getByUserId(userId: string) {
    const courier = await this.repo.findOne({ where: { userId }, relations: { user: true } });
    if (!courier) throw new NotFoundException('Courier profile not found');
    return courier;
  }

  async register(userId: string, dto: RegisterCourierDto) {
    if (await this.repo.existsBy({ userId })) throw new ConflictException('Courier already registered');
    return this.repo.save(this.repo.create({ userId, vehicle: dto.vehicle }));
  }

  /** Promedio móvil del rating al recibir una calificación. */
  async applyRating(courierId: string, score: number) {
    const courier = await this.getById(courierId);
    const count = courier.ratingsCount ?? 0;
    courier.rating = (Number(courier.rating) * count + score) / (count + 1);
    courier.ratingsCount = count + 1;
    return this.repo.save(courier);
  }

  /** Resumen de ganancias del repartidor autenticado. */
  async earnings(userId: string) {
    const courier = await this.getByUserId(userId);
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 86400000);
    const delivered = await this.jobs.find({
      where: { courierId: courier.id, status: JobStatus.DELIVERED, completedAt: Between(start, now) },
      order: { completedAt: 'ASC' },
    });
    const daily = new Array(7).fill(0);
    for (const j of delivered) {
      const d = new Date(j.completedAt!);
      const idx = (d.getDay() + 6) % 7; // Lunes = 0
      daily[idx] += Number(j.price ?? 0);
    }
    const max = Math.max(...daily, 1);
    const week = delivered.reduce((acc, j) => acc + Number(j.price ?? 0), 0);
    const month = await this.earningsBetween(courier.id, new Date(now.getTime() - 30 * 86400000), now);
    return {
      today: Number(daily[(now.getDay() + 6) % 7] ?? 0),
      week,
      month,
      completed: delivered.length,
      rating: Number(courier.rating),
      ratingsCount: courier.ratingsCount,
      dailyBars: daily.map((v) => v / max),
      breakdown: [
        ['Envíos', week, delivered.length],
      ] as [string, number, number][],
    };
  }

  private async earningsBetween(courierId: string, from: Date, to: Date) {
    const delivered = await this.jobs.find({
      where: { courierId, status: JobStatus.DELIVERED, completedAt: Between(from, to) },
    });
    return delivered.reduce((acc, j) => acc + Number(j.price ?? 0), 0);
  }

  /** Historial financiero simple derivado de pedidos completados y retiros. */
  async transactions(userId: string) {
    const courier = await this.getByUserId(userId);
    const delivered = await this.jobs.find({
      where: { courierId: courier.id, status: JobStatus.DELIVERED },
      order: { completedAt: 'DESC' },
      take: 50,
    });
    return delivered.map((j) => ({
      id: j.id,
      title: `Pedido #VX-${j.id.slice(0, 6).toUpperCase()} · Ganancia`,
      at: j.completedAt,
      amount: Number(j.price),
      status: 'Completado',
    }));
  }

  /** Estado de verificación del repartidor (null → pending). */
  async verification(userId: string) {
    const courier = await this.getByUserId(userId);
    const v = courier.verification ?? {};
    const steps = ['identity', 'vehicle', 'insurance', 'background'].map((k) => ({
      type: k,
      status: v[k]?.status ?? 'required',
      urls: v[k]?.urls ?? [],
    }));
    return {
      steps,
      progress: steps.filter((s) => s.status === 'verified').length / steps.length,
      vehicleDetails: courier.vehicleDetails ?? null,
    };
  }

  async submitVerification(userId: string, dto: SubmitVerificationDto) {
    const courier = await this.getByUserId(userId);
    courier.verification = {
      ...(courier.verification ?? {}),
      [dto.type]: { status: 'pending', urls: dto.urls, meta: dto.meta },
    };
    return this.repo.save(courier);
  }

  async updateVehicleDetails(userId: string, dto: UpdateVehicleDetailsDto) {
    const courier = await this.getByUserId(userId);
    courier.vehicleDetails = {
      make: dto.make,
      year: dto.year,
      plate: dto.plate,
      color: dto.color,
    };
    if (dto.vehicleType) courier.vehicle = dto.vehicleType;
    return this.repo.save(courier);
  }

  /** Solicitud de retiro. El saldo disponible = ganado - retirado/pendiente. */
  async requestPayout(userId: string, dto: CreatePayoutDto) {
    const courier = await this.getByUserId(userId);
    const [{ earned }] = await this.jobs.query(
      `SELECT COALESCE(SUM(price), 0) AS earned FROM jobs
       WHERE courier_id = $1 AND status = 'DELIVERED'`,
      [courier.id],
    );
    const [{ held }] = await this.payouts.query(
      `SELECT COALESCE(SUM(amount), 0) AS held FROM payouts
       WHERE courier_id = $1 AND status IN ('PENDING','PROCESSING','COMPLETED')`,
      [courier.id],
    );
    const available = Number(earned) - Number(held);
    if (dto.amount <= 0 || dto.amount > available) {
      throw new BadRequestException(`Saldo insuficiente (disponible: ${available})`);
    }
    return this.payouts.save(
      this.payouts.create({ courierId: courier.id, amount: dto.amount, method: dto.method }),
    );
  }

  listPayouts(userId: string) {
    return this.getByUserId(userId).then((c) =>
      this.payouts.find({ where: { courierId: c.id }, order: { createdAt: 'DESC' }, take: 50 }),
    );
  }

  /** Métricas de desempeño: puntualidad, aceptación, completado, rating. */
  async performance(userId: string) {
    const courier = await this.getByUserId(userId);
    const row = (await this.jobs
      .createQueryBuilder('j')
      .select("COUNT(*) FILTER (WHERE j.status = 'DELIVERED')", 'delivered')
      .addSelect("COUNT(*) FILTER (WHERE j.status = 'CANCELLED')", 'cancelled')
      .addSelect('COUNT(*)', 'total')
      .addSelect("AVG(EXTRACT(EPOCH FROM (j.completed_at - j.created_at)) / 60)", 'avgMinutes')
      .where('j.courier_id = :id', { id: courier.id })
      .getRawOne()) ?? {};
    const total = Number(row.total ?? 0);
    const delivered = Number(row.delivered ?? 0);
    const cancelled = Number(row.cancelled ?? 0);
    const completionRate = total > 0 ? delivered / total : 0;
    // Aceptación ≈ (completados + en curso) / (ofertas asignadas); proxy simple.
    const acceptanceRate = total > 0 ? Math.min(1, (total - cancelled) / total) : 0;
    const onTimeRate = await this.computeOnTimeRate(courier.id);
    return {
      onTimeRate,
      acceptanceRate,
      completionRate,
      rating: Number(courier.rating),
      ratingsCount: courier.ratingsCount,
      avgDeliveryMinutes: row.avgMinutes ? Number(row.avgMinutes) : null,
      totalJobs: total,
    };
  }

  private async computeOnTimeRate(courierId: string) {
    const delivered = await this.jobs.find({
      where: { courierId, status: JobStatus.DELIVERED },
      select: ['acceptedAt', 'completedAt', 'distanceMeters'],
    });
    if (!delivered.length) return 0;
    let onTime = 0;
    for (const j of delivered) {
      if (!j.acceptedAt || !j.completedAt) continue;
      const minutes = (new Date(j.completedAt).getTime() - new Date(j.acceptedAt).getTime()) / 60000;
      const expected = j.distanceMeters ? (j.distanceMeters / 1000) * 6 + 15 : 45;
      if (minutes <= expected) onTime++;
    }
    return onTime / delivered.length;
  }

  /** Reseñas de pedidos con calificación para el repartidor. */
  async reviews(courierId: string) {
    const rows = await this.jobs.find({
      where: { courierId, status: JobStatus.DELIVERED },
      order: { completedAt: 'DESC' },
      take: 50,
      relations: { company: true },
    });
    return rows
      .filter((j) => j.ratingScore != null)
      .map((j) => ({
        id: `${courierId}-${j.id}`,
        author: j.company?.name ?? 'Empresa',
        when: j.completedAt,
        stars: j.ratingScore,
        text: j.ratingComment ?? 'Sin comentario',
      }));
  }

  /** Perfil público del repartidor. */
  async profile(courierId: string) {
    const courier = await this.repo.findOne({
      where: { id: courierId },
      relations: { user: true },
    });
    if (!courier) throw new NotFoundException(`Courier ${courierId} not found`);
    const [totalJobs, accepted, offered] = await Promise.all([
      this.jobs.countBy({ courierId, status: JobStatus.DELIVERED }),
      this.jobs.countBy({ courierId, status: JobStatus.ACCEPTED }),
      this.jobs.countBy({ courierId, status: JobStatus.OFFERED }),
    ]);
    const all = totalJobs + accepted + offered;
    const onTimeRate = await this.computeOnTimeRate(courier.id);
    return {
      name: courier.user?.fullName ?? 'Repartidor',
      rating: Number(courier.rating ?? 0),
      totalJobs,
      onTimeRate,
      acceptanceRate: all > 0 ? (accepted + totalJobs) / all : 0,
    };
  }

  /** Distribución y comentarios de reseñas del repartidor autenticado. */
  async myReviews(userId: string) {
    const courier = await this.getByUserId(userId);
    const rows = await this.reviews(courier.id);
    const distribution = [0, 0, 0, 0, 0]; // 5★ -> 1★
    for (const r of rows) {
      const idx = 5 - (r.stars ?? 1);
      if (idx >= 0 && idx < 5) distribution[idx]++;
    }
    return {
      average: rows.length ? rows.reduce((a, r) => a + (r.stars ?? 0), 0) / rows.length : 0,
      total: rows.length,
      distribution,
      comments: rows.slice(0, 10),
    };
  }

  /** Programa de recompensas derivado del historial. */
  async rewards(userId: string) {
    const courier = await this.getByUserId(userId);
    const delivered = await this.jobs.countBy({ courierId: courier.id, status: JobStatus.DELIVERED });
    const points = delivered * 10;
    const tier = points >= 5000 ? 'ORO' : points >= 2000 ? 'PLATA' : 'BRONCE';
    return {
      points,
      tier,
      delivered,
      referralCode: `VEXA-${courier.id.slice(0, 6).toUpperCase()}`,
      nextTierAt: tier === 'ORO' ? null : tier === 'PLATA' ? 5000 : 2000,
    };
  }

  async updateStatus(userId: string, status: CourierStatus) {
    const courier = await this.getByUserId(userId);
    courier.status = status;
    if (status === CourierStatus.OFFLINE) await this.redis.removeCourierLocation(courier.id);
    return this.repo.save(courier);
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    const courier = await this.getByUserId(userId);
    courier.fcmToken = fcmToken;
    return this.repo.save(courier);
  }

  async updateLocation(userId: string, dto: UpdateCourierLocationDto, jobId?: string) {
    const courier = await this.getByUserId(userId);
    const recordedAt = new Date();
    await Promise.all([
      this.repo.update(
        { id: courier.id },
        {
          lastLocation: { type: 'Point', coordinates: [dto.lng, dto.lat] },
          lastLocationAt: recordedAt,
        }
      ),
      this.redis.setCourierLocation(courier.id, dto),
    ]);
    const event: CourierLocationEvent = {
      courierId: courier.id,
      jobId,
      lat: dto.lat,
      lng: dto.lng,
      heading: dto.heading,
      speed: dto.speed,
      recordedAt: recordedAt.toISOString(),
    };
    await this.redis.publish(RedisChannels.COURIER_LOCATION, event);
    return event;
  }

  findNearbyFromDatabase(center: GeoPoint, radiusMeters = MatchingDefaults.RADIUS_METERS, limit = MatchingDefaults.MAX_CANDIDATES) {
    return this.repo
      .createQueryBuilder('courier')
      .addSelect(
        'ST_Distance(courier.last_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
        'distance'
      )
      .where('courier.status = :status', { status: CourierStatus.AVAILABLE })
      .andWhere(
        'ST_DWithin(courier.last_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lng: center.lng, lat: center.lat, radius: radiusMeters }
      )
      .orderBy('distance', 'ASC')
      .limit(limit)
      .getMany();
  }
}
