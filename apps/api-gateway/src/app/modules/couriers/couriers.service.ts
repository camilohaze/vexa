import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { RedisService } from '@vexa/core';
import {
  CourierLocationEvent,
  CourierStatus,
  GeoPoint,
  JobStatus,
  MatchingDefaults,
  Paginated,
  RedisChannels,
} from '@vexa/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { JobEntity } from '../jobs/job.entity';
import { BonusEntity, BonusType } from './bonus.entity';
import { CourierEntity } from './courier.entity';
import { PayoutEntity, PayoutStatus } from './payout.entity';
import {
  CreatePayoutDto,
  PageDateQueryDto,
  RegisterCourierDto,
  SubmitVerificationDto,
  UpdateCourierLocationDto,
  UpdateVehicleDetailsDto,
} from './dto';

/** Aplica el rango [from, to] de un PageDateQueryDto a una columna de fecha dada. */
function dateRangeWhere(query: PageDateQueryDto) {
  if (query.from && query.to) return Between(new Date(query.from), new Date(query.to));
  if (query.from) return MoreThanOrEqual(new Date(query.from));
  if (query.to) return LessThanOrEqual(new Date(query.to));
  return undefined;
}

@Injectable()
export class CouriersService {
  constructor(
    @InjectRepository(CourierEntity)
    private readonly repo: Repository<CourierEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(PayoutEntity)
    private readonly payouts: Repository<PayoutEntity>,
    @InjectRepository(BonusEntity)
    private readonly bonusesRepo: Repository<BonusEntity>,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService
  ) {}

  /** Puntos, nivel y multiplicador de pago del repartidor, derivados del historial. */
  private async currentTier(courierId: string) {
    const delivered = await this.jobs.countBy({ courierId, status: JobStatus.DELIVERED });
    const points = delivered * 10;
    const tier = points >= 5000 ? 'ORO' : points >= 2000 ? 'PLATA' : 'BRONCE';
    const multiplier = tier === 'ORO' ? 5 : tier === 'PLATA' ? 3 : 2;
    return { delivered, points, tier, multiplier };
  }

  private startOfWeek(date: Date) {
    const start = new Date(date);
    const mondayOffset = (start.getDay() + 6) % 7; // Lunes = 0
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - mondayOffset);
    return start;
  }

  /** Meta semanal: umbral de entregas y monto del bono, ver docs/BONUSES.md. */
  private readonly weeklyQuestTarget = 5;
  private readonly weeklyQuestBonus = 15000;

  /**
   * Calcula y acredita los bonos monetarios de un repartidor al completar un
   * pedido: el multiplicador de su nivel actual de Recompensas sobre el
   * precio del pedido, y el bono de meta semanal la primera vez que alcanza
   * el umbral de entregas en la semana (lunes–domingo) en curso.
   */
  async applyDeliveryBonuses(courierId: string, jobId: string, price: number) {
    const { tier, multiplier } = await this.currentTier(courierId);
    const levelBonus = Math.round(price * multiplier) / 100;
    if (levelBonus > 0) {
      const description = `Bono de nivel ${tier} (+${multiplier}%)`;
      await this.bonusesRepo.save(
        this.bonusesRepo.create({ courierId, jobId, type: BonusType.LEVEL_MULTIPLIER, amount: levelBonus, description }),
      );
      await this.notifyBonus(courierId, levelBonus, description);
    }

    const weekStart = this.startOfWeek(new Date());
    const weekCount = await this.jobs.count({
      where: { courierId, status: JobStatus.DELIVERED, completedAt: MoreThanOrEqual(weekStart) },
    });
    if (weekCount >= this.weeklyQuestTarget) {
      const alreadyCredited = await this.bonusesRepo.existsBy({
        courierId,
        type: BonusType.WEEKLY_QUEST,
        createdAt: MoreThanOrEqual(weekStart),
      });
      if (!alreadyCredited) {
        const description = `Meta semanal: ${this.weeklyQuestTarget} entregas completadas`;
        await this.bonusesRepo.save(
          this.bonusesRepo.create({ courierId, type: BonusType.WEEKLY_QUEST, amount: this.weeklyQuestBonus, description }),
        );
        await this.notifyBonus(courierId, this.weeklyQuestBonus, description);
      }
    }
  }

  private readonly copFormat = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  private async notifyBonus(courierId: string, amount: number, description: string) {
    try {
      await this.notifications.create({
        scope: 'courier',
        courierId,
        icon: 'stars',
        title: 'Ganaste un bono',
        body: `${description} · ${this.copFormat.format(amount)}`,
        referenceType: 'bonus',
      });
    } catch {
      // Un fallo al notificar no debe afectar el bono ya acreditado.
    }
  }

  /** Historial de bonos del repartidor autenticado. */
  async bonuses(userId: string, query: PageDateQueryDto): Promise<Paginated<BonusEntity>> {
    const courier = await this.getByUserId(userId);
    const where: FindOptionsWhere<BonusEntity> = { courierId: courier.id };
    const range = dateRangeWhere(query);
    if (range) where.createdAt = range;

    const [items, total] = await this.bonusesRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findAll() {
    const couriers = await this.repo.find({ relations: { user: true }, order: { createdAt: 'DESC' } });
    const ids = couriers.map((c) => c.id);
    const counts = await this.jobs
      .createQueryBuilder('j')
      .select('j.courier_id', 'courierId')
      .addSelect('COUNT(*)', 'count')
      .where('j.courier_id IN (:...ids) AND j.status = :status', { ids, status: JobStatus.DELIVERED })
      .groupBy('j.courier_id')
      .getRawMany<{ courierId: string; count: string }>();
    const countMap = new Map(counts.map((c) => [c.courierId, Number(c.count)]));
    return couriers.map((c) => ({
      ...c,
      deliveredCount: countMap.get(c.id) ?? 0,
      verificationStatus: this.aggregateVerification(c.verification),
    }));
  }

  private aggregateVerification(v?: Record<string, { status: string }> | null) {
    if (!v) return 'Pendiente';
    const values = Object.values(v);
    if (values.every((x) => x.status === 'verified')) return 'Verificado';
    if (values.some((x) => x.status === 'rejected')) return 'Rechazado';
    return 'Pendiente';
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

  private defaultPayoutMethods(email: string) {
    return [
      { key: 'bank_transfer', label: 'Transferencia bancaria', detail: 'Cuenta Vexa Direct', fee: 'Gratis', time: 'Instante · 2 horas' },
      { key: 'paypal', label: 'PayPal', detail: email, fee: '$1.50 comisión', time: '1–2 días hábiles' },
      { key: 'nequi', label: 'Nequi / Billetera móvil', detail: 'Pago instantáneo', fee: '1% comisión', time: 'Instante' },
    ];
  }

  async payoutMethods(userId: string) {
    const courier = await this.repo.findOne({ where: { userId }, relations: { user: true } });
    if (!courier) throw new NotFoundException('Courier profile not found');
    if (!courier.payoutDetails?.methods?.length) {
      const methods = this.defaultPayoutMethods(courier.user?.email ?? 'Cuenta vinculada');
      courier.payoutDetails = { methods };
      await this.repo.save(courier);
    }
    return courier.payoutDetails.methods;
  }

  /** Promedio móvil del rating al recibir una calificación. */
  async applyRating(courierId: string, score: number) {
    const courier = await this.getById(courierId);
    const count = courier.ratingsCount ?? 0;
    courier.rating = (Number(courier.rating) * count + score) / (count + 1);
    courier.ratingsCount = count + 1;
    const saved = await this.repo.save(courier);
    try {
      await this.notifications.create({
        scope: 'courier',
        courierId,
        icon: 'star',
        title: 'Nueva calificación',
        body: `Recibiste una calificación de ${score} estrella${score === 1 ? '' : 's'}.`,
        referenceType: 'rating',
      });
    } catch {
      // Un fallo al notificar no debe afectar la calificación ya aplicada.
    }
    return saved;
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
    const monthStart = new Date(now.getTime() - 30 * 86400000);
    const monthEarnings = await this.earningsBetween(courier.id, monthStart, now);
    const monthBonuses = await this.bonusesRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'total')
      .where('b.courier_id = :id AND b.created_at >= :start', { id: courier.id, start: monthStart })
      .getRawOne<{ total: string }>();
    const month = monthEarnings + Number(monthBonuses?.total ?? 0);
    return {
      today: Number(daily[(now.getDay() + 6) % 7] ?? 0),
      week,
      month,
      completed: delivered.length,
      rating: Number(courier.rating),
      ratingsCount: courier.ratingsCount,
      dailyBars: daily.map((v) => v / max),
      breakdown: this.earningsBreakdown(delivered),
    };
  }

  private earningsBreakdown(delivered: JobEntity[]): [string, number, number][] {
    const labels: Record<string, string> = {
      document: 'Documentos',
      small: 'Paquete pequeño',
      large: 'Paquete grande',
      pallet: 'Pallet',
    };
    const groups = new Map<string, { amount: number; count: number }>();
    for (const j of delivered) {
      const key = j.packageType ?? 'other';
      const g = groups.get(key) ?? { amount: 0, count: 0 };
      g.amount += Number(j.price ?? 0);
      g.count += 1;
      groups.set(key, g);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([key, g]) => [labels[key] ?? 'Otros', g.amount, g.count]);
  }

  private async earningsBetween(courierId: string, from: Date, to: Date) {
    const delivered = await this.jobs.find({
      where: { courierId, status: JobStatus.DELIVERED, completedAt: Between(from, to) },
    });
    return delivered.reduce((acc, j) => acc + Number(j.price ?? 0), 0);
  }

  /** Historial financiero simple derivado de pedidos completados, paginado y filtrable por fecha. */
  async transactions(userId: string, query: PageDateQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const courier = await this.getByUserId(userId);
    const where: FindOptionsWhere<JobEntity> = { courierId: courier.id, status: JobStatus.DELIVERED };
    const range = dateRangeWhere(query);
    if (range) where.completedAt = range;

    const [delivered, total] = await this.jobs.findAndCount({
      where,
      order: { completedAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: delivered.map((j) => ({
        id: j.id,
        title: `Pedido #VX-${j.id.slice(0, 6).toUpperCase()} · Ganancia`,
        at: j.completedAt,
        amount: Number(j.price),
        status: 'Completado',
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** Estado de verificación del repartidor (null → pending). */
  async verification(userId: string) {
    const courier = await this.getByUserId(userId);
    const v = courier.verification ?? {};
    const steps = ['identity', 'vehicle', 'insurance', 'background'].map((k) => ({
      type: k,
      status: v[k]?.status ?? 'required',
      urls: v[k]?.urls ?? [],
      meta: v[k]?.meta ?? null,
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

  /** Solicitud de retiro. El saldo disponible = ganado (pedidos + bonos) - retirado/pendiente. */
  async requestPayout(userId: string, dto: CreatePayoutDto) {
    const courier = await this.getByUserId(userId);
    const [{ earned }] = await this.jobs.query(
      `SELECT
         (SELECT COALESCE(SUM(price), 0) FROM jobs WHERE courier_id = $1 AND status = 'DELIVERED') +
         (SELECT COALESCE(SUM(amount), 0) FROM bonuses WHERE courier_id = $1) AS earned`,
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

  async listPayouts(userId: string, query: PageDateQueryDto): Promise<Paginated<PayoutEntity>> {
    const courier = await this.getByUserId(userId);
    const where: FindOptionsWhere<PayoutEntity> = { courierId: courier.id };
    const range = dateRangeWhere(query);
    if (range) where.createdAt = range;

    const [items, total] = await this.payouts.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** Bandeja de notificaciones del repartidor autenticado, paginada y filtrable por fecha. */
  async notificationsFeed(userId: string, query: PageDateQueryDto) {
    const courier = await this.getByUserId(userId);
    return this.notifications.feed('courier', courier.id, query);
  }

  async markNotificationRead(userId: string, id: string) {
    const courier = await this.getByUserId(userId);
    const updated = await this.notifications.markReadFor('courier', courier.id, id);
    if (!updated) throw new NotFoundException('Notificación no encontrada');
    return updated;
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
  async reviews(courierId: string, query?: PageDateQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 50;
    const qb = this.jobs
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.courier_id = :courierId', { courierId })
      .andWhere('job.status = :status', { status: JobStatus.DELIVERED })
      .andWhere('job.rating_score IS NOT NULL');
    if (query?.from) qb.andWhere('job.completed_at >= :from', { from: new Date(query.from) });
    if (query?.to) qb.andWhere('job.completed_at <= :to', { to: new Date(query.to) });

    const [rows, total] = await qb
      .orderBy('job.completedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((j) => ({
        id: `${courierId}-${j.id}`,
        author: j.company?.name ?? 'Empresa',
        when: j.completedAt,
        stars: j.ratingScore,
        text: j.ratingComment ?? 'Sin comentario',
      })),
      total,
      page,
      pageSize,
    };
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
      avatarUrl: courier.user?.avatarUrl ?? null,
      vehicle: courier.vehicle,
      vehicleDetails: courier.vehicleDetails ?? null,
      rating: Number(courier.rating ?? 0),
      totalJobs,
      onTimeRate,
      acceptanceRate: all > 0 ? (accepted + totalJobs) / all : 0,
    };
  }

  /** Distribución y comentarios de reseñas del repartidor autenticado. */
  async myReviews(userId: string, query: PageDateQueryDto) {
    const courier = await this.getByUserId(userId);
    // Promedio y distribución se calculan sobre el histórico completo, no solo
    // la página actual — igual que totalCount/totalSpend en jobs.history().
    const allScored = await this.jobs.find({
      where: { courierId: courier.id, status: JobStatus.DELIVERED },
      select: ['ratingScore'],
    });
    const stars = allScored.map((j) => j.ratingScore).filter((s): s is number => s != null);
    const distribution = [0, 0, 0, 0, 0]; // 5★ -> 1★
    for (const s of stars) {
      const idx = 5 - s;
      if (idx >= 0 && idx < 5) distribution[idx]++;
    }
    const paged = await this.reviews(courier.id, query);
    return {
      average: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0,
      total: stars.length,
      distribution,
      comments: paged.items,
      commentsTotal: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
    };
  }

  /** Programa de recompensas derivado del historial. */
  async rewards(userId: string) {
    const courier = await this.getByUserId(userId);
    const { delivered, points, tier, multiplier } = await this.currentTier(courier.id);
    const benefits = [
      'Multiplicador de pago +$multiplier%',
      'Asignación prioritaria',
      'Soporte dedicado',
    ].map((b) => b.replace('$multiplier', multiplier.toString()));
    const earnRules = [
      { action: 'Entrega a tiempo', points: 50 },
      { action: 'Ruta en hora pico completada', points: 120 },
      { action: 'POD cargado en menos de 5 min', points: 20 },
    ];
    return {
      points,
      tier,
      delivered,
      referralCode: `VEXA-${courier.id.slice(0, 6).toUpperCase()}`,
      nextTierAt: tier === 'ORO' ? null : tier === 'PLATA' ? 5000 : 2000,
      benefits,
      earnRules,
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

  /** Repartidores disponibles cerca de un punto, sin el límite de candidatos del matching. */
  countAvailableNearby(center: GeoPoint, radiusMeters = MatchingDefaults.RADIUS_METERS): Promise<number> {
    return this.repo
      .createQueryBuilder('courier')
      .where('courier.status = :status', { status: CourierStatus.AVAILABLE })
      .andWhere(
        'ST_DWithin(courier.last_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lng: center.lng, lat: center.lat, radius: radiusMeters }
      )
      .getCount();
  }
}
