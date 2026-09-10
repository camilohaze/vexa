import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { AuthenticatedUser } from '@vexa/auth';
import { RedisService } from '@vexa/core';
import {
  GeoPoint,
  JobAcceptedEvent,
  JobCancelledEvent,
  JobCompletedEvent,
  JobMessageEvent,
  JobStatus,
  MatchingDefaults,
  Paginated,
  RedisChannels,
  UserRole,
} from '@vexa/shared';
import { CompaniesService } from '../companies/companies.service';
import { CouriersService } from '../couriers/couriers.service';
import {
  CancelJobDto,
  CompleteJobDto,
  CreateJobDto,
  JobHistoryQueryDto,
  ListJobsQueryDto,
  PriceEstimateQueryDto,
  RateJobDto,
  SendMessageDto,
} from './dto';
import { DirectionsService } from './directions.service';
import { JobEntity } from './job.entity';
import { JobMessageEntity } from './message.entity';
import { PriceConfigEntity } from './price-config.entity';

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.OFFERED, JobStatus.ACCEPTED, JobStatus.CANCELLED],
  [JobStatus.OFFERED]: [JobStatus.ACCEPTED, JobStatus.PENDING, JobStatus.CANCELLED],
  [JobStatus.ACCEPTED]: [JobStatus.PICKED_UP, JobStatus.CANCELLED],
  [JobStatus.PICKED_UP]: [JobStatus.IN_TRANSIT, JobStatus.DELIVERED, JobStatus.CANCELLED],
  [JobStatus.IN_TRANSIT]: [JobStatus.DELIVERED, JobStatus.CANCELLED],
  [JobStatus.DELIVERED]: [],
  [JobStatus.CANCELLED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repo: Repository<JobEntity>,
    @InjectRepository(JobMessageEntity)
    private readonly messages: Repository<JobMessageEntity>,
    @InjectRepository(PriceConfigEntity)
    private readonly priceConfig: Repository<PriceConfigEntity>,
    private readonly dataSource: DataSource,
    private readonly companies: CompaniesService,
    private readonly couriers: CouriersService,
    private readonly redis: RedisService,
    private readonly directions: DirectionsService
  ) {}

  async create(dto: CreateJobDto, user: AuthenticatedUser) {
    const company = await this.companies.getForUser(user);
    const job = this.repo.create({
      companyId: company.id,
      pickup: dto.pickup,
      dropoff: dto.dropoff,
      pickupPoint: { type: 'Point', coordinates: [dto.pickup.lng, dto.pickup.lat] },
      dropoffPoint: { type: 'Point', coordinates: [dto.dropoff.lng, dto.dropoff.lat] },
      price: dto.price,
      notes: dto.notes,
      packageType: dto.packageType,
      weightKg: dto.weightKg,
      dimensions: dto.dimensions,
      declaredValue: dto.declaredValue,
      fragile: dto.fragile ?? false,
      refrigerated: dto.refrigerated ?? false,
      priority: dto.priority ?? 'standard',
      priceBreakdown: dto.priceBreakdown,
      status: JobStatus.PENDING,
    });
    const saved = await this.repo.save(job);
    saved.distanceMeters = await this.computeDistance(saved.id);
    await this.repo.update({ id: saved.id }, { distanceMeters: saved.distanceMeters });
    await this.redis.publish(RedisChannels.JOB_CREATED, this.toJson(saved));
    return saved;
  }

  async list(query: ListJobsQueryDto, user: AuthenticatedUser): Promise<Paginated<JobEntity>> {
    const where: FindOptionsWhere<JobEntity> = {};
    if (query.status) where.status = query.status;
    if (user.role === UserRole.COMPANY) where.companyId = (await this.companies.getForUser(user)).id;
    if (user.role === UserRole.COURIER) {
      const courier = await this.couriers.getByUserId(user.id);
      where.courierId =
        query.status === JobStatus.OFFERED || query.status === JobStatus.PENDING
          ? IsNull()
          : courier.id;
    }
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** Historial de entregas completadas de la empresa, con estadísticas agregadas sobre todo el filtro (no solo la página). */
  async history(query: JobHistoryQueryDto, user: AuthenticatedUser) {
    const company = await this.companies.getForUser(user);
    const qb = this.repo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.courier', 'courier')
      .leftJoinAndSelect('courier.user', 'courierUser')
      .where('job.companyId = :companyId', { companyId: company.id })
      .andWhere('job.status = :status', { status: JobStatus.DELIVERED });

    if (query.from) qb.andWhere('job.createdAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('job.createdAt <= :to', { to: new Date(query.to) });
    if (query.search) {
      qb.andWhere(
        `(job.pickup->>'city' ILIKE :search OR job.dropoff->>'city' ILIKE :search OR job.packageType ILIKE :search OR courierUser.fullName ILIKE :search OR CAST(job.id AS text) ILIKE :search)`,
        { search: `%${query.search}%` }
      );
    }

    const [totalCount, totalSpendRow, avgTransportRow] = await Promise.all([
      qb.clone().getCount(),
      qb.clone().select('COALESCE(SUM("job"."price"), 0)', 'sum').getRawOne<{ sum: string }>(),
      qb
        .clone()
        .select(
          'AVG(EXTRACT(EPOCH FROM ("job"."completed_at" - COALESCE("job"."picked_up_at", "job"."accepted_at"))))',
          'avgSeconds'
        )
        .getRawOne<{ avgSeconds: string | null }>(),
    ]);

    const items = await qb
      .orderBy('job.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    return {
      items,
      total: totalCount,
      page: query.page,
      pageSize: query.pageSize,
      stats: {
        totalCount,
        totalSpend: Number(totalSpendRow?.sum ?? 0),
        avgTransportSeconds: avgTransportRow?.avgSeconds ? Number(avgTransportRow.avgSeconds) : 0,
      },
    };
  }

  async getById(id: string, user: AuthenticatedUser) {
    const job = await this.repo.findOne({ where: { id }, relations: { courier: { user: true } } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    await this.assertAccess(job, user);
    return job;
  }

  async accept(id: string, user: AuthenticatedUser) {
    const courier = await this.couriers.getByUserId(user.id);
    return this.dataSource.transaction(async (manager) => {
      const job = await manager.findOne(JobEntity, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!job) throw new NotFoundException(`Job ${id} not found`);
      if (job.courierId) throw new BadRequestException('Job already taken');
      this.assertTransition(job, JobStatus.ACCEPTED);
      job.courierId = courier.id;
      job.status = JobStatus.ACCEPTED;
      job.acceptedAt = new Date();
      const saved = await manager.save(job);
      const event: JobAcceptedEvent = {
        jobId: saved.id,
        courierId: courier.id,
        acceptedAt: saved.acceptedAt!.toISOString(),
      };
      await this.redis.publish(RedisChannels.JOB_ACCEPTED, event);
      return saved;
    });
  }

  async advance(id: string, status: JobStatus.PICKED_UP | JobStatus.IN_TRANSIT, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    this.assertTransition(job, status);
    job.status = status;
    if (status === JobStatus.PICKED_UP) job.pickedUpAt = new Date();
    return this.repo.save(job);
  }

  async complete(id: string, dto: CompleteJobDto, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    this.assertTransition(job, JobStatus.DELIVERED);
    job.status = JobStatus.DELIVERED;
    job.completedAt = new Date();
    job.proofOfDeliveryUrl = dto.proofOfDeliveryUrl;
    job.podSignedBy = dto.podSignedBy;
    const saved = await this.repo.save(job);
    const event: JobCompletedEvent = {
      jobId: saved.id,
      courierId: saved.courierId!,
      proofOfDeliveryUrl: saved.proofOfDeliveryUrl ?? undefined,
      completedAt: saved.completedAt!.toISOString(),
    };
    await this.redis.publish(RedisChannels.JOB_COMPLETED, event);
    return saved;
  }

  async cancel(id: string, dto: CancelJobDto, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    this.assertTransition(job, JobStatus.CANCELLED);
    job.status = JobStatus.CANCELLED;
    const saved = await this.repo.save(job);
    const event: JobCancelledEvent = {
      jobId: saved.id,
      reason: dto.reason,
      cancelledBy: user.role === UserRole.ADMIN ? 'ADMIN' : user.role === UserRole.COURIER ? 'COURIER' : 'COMPANY',
    };
    await this.redis.publish(RedisChannels.JOB_CANCELLED, event);
    return saved;
  }

  private async ensurePriceConfig() {
    let cfg = await this.priceConfig.findOneBy({});
    if (!cfg) {
      cfg = this.priceConfig.create({
        base: 8000,
        perKm: 1500,
        perKg: 500,
        perMinute: 120,
        expressMultiplier: 1.35,
        sameDayMultiplier: 1.6,
        commissionPercent: 20,
        demandMultiplierMax: 1.3,
      });
      await this.priceConfig.save(cfg);
    }
    return cfg;
  }

  /** Pedidos activos (pendientes o recién ofrecidos, sin repartidor aún) cerca de un punto. */
  private countPendingNearby(pickup: GeoPoint, radiusMeters: number): Promise<number> {
    return this.repo
      .createQueryBuilder('job')
      .where('job.status IN (:...statuses)', { statuses: [JobStatus.PENDING, JobStatus.OFFERED] })
      .andWhere(
        'ST_DWithin(job.pickup_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lng: pickup.lng, lat: pickup.lat, radius: radiusMeters }
      )
      .getCount();
  }

  /**
   * Multiplicador por demanda: 1.0 cuando hay suficientes repartidores disponibles cerca
   * frente a los pedidos activos en la zona; sube hasta demandMultiplierMax a medida que
   * la relación pedidos/repartidores se dispara. Sin repartidores disponibles y al menos
   * un pedido activo cercano, se aplica el máximo directamente.
   */
  private computeDemandMultiplier(availableNearby: number, pendingNearby: number, max: number): number {
    if (pendingNearby === 0) return 1;
    if (availableNearby === 0) return max;
    const ratio = pendingNearby / availableNearby;
    if (ratio <= 1) return 1;
    const t = Math.min(1, (ratio - 1) / 2); // ratio 1→3 se mapea linealmente a 0→1
    return 1 + t * (max - 1);
  }

  /**
   * Tarifa sugerida: base + distancia + tiempo (con tráfico real vía Mapbox cuando hay
   * MAPBOX_TOKEN configurado) + peso, multiplicador por prioridad, multiplicador por demanda
   * real (repartidores disponibles vs. pedidos activos cerca de la recogida), + comisión.
   */
  async priceEstimate(query: PriceEstimateQueryDto) {
    const cfg = await this.ensurePriceConfig();
    const pickup = { lat: query.pickupLat, lng: query.pickupLng };
    const [route, availableNearby, pendingNearby] = await Promise.all([
      this.directions.route(pickup, { lat: query.dropoffLat, lng: query.dropoffLng }),
      this.couriers.countAvailableNearby(pickup, MatchingDefaults.RADIUS_METERS),
      this.countPendingNearby(pickup, MatchingDefaults.RADIUS_METERS),
    ]);

    const base = Number(cfg.base);
    const perKm = Number(cfg.perKm);
    const perMinute = Number(cfg.perMinute);
    const perKg = Number(cfg.perKg);
    const commissionPercent = Number(cfg.commissionPercent);
    const weightKg = query.weightKg ?? 0;

    const km = route.distanceMeters / 1000;
    const minutes = route.durationSeconds / 60;

    const distanceCost = perKm * km;
    // El tráfico ya queda reflejado aquí: durationSeconds viene del perfil driving-traffic de Mapbox.
    const timeCost = perMinute * minutes;
    const weightCost = perKg * weightKg;

    const priority = query.priority ?? 'standard';
    const priorityMultiplier =
      priority === 'express' ? Number(cfg.expressMultiplier) : priority === 'same_day' ? Number(cfg.sameDayMultiplier) : 1;
    const demandMultiplier = this.computeDemandMultiplier(availableNearby, pendingNearby, Number(cfg.demandMultiplierMax));

    const subtotal = (base + distanceCost + timeCost + weightCost) * priorityMultiplier * demandMultiplier;
    const commission = subtotal * (commissionPercent / 100);
    const total = subtotal + commission;

    return {
      currency: 'COP',
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      trafficAware: route.trafficAware,
      demand: { availableCouriersNearby: availableNearby, activeJobsNearby: pendingNearby },
      breakdown: {
        base,
        distance: Math.round(distanceCost),
        time: Math.round(timeCost),
        weight: Math.round(weightCost),
        priorityMultiplier,
        demandMultiplier,
        subtotal: Math.round(subtotal),
        commission: Math.round(commission),
      },
      price: Math.round(total / 100) * 100,
    };
  }

  /** Recibo digital generado dinámicamente como data URL. */
  async receipt(id: string, user: AuthenticatedUser) {
    const job = await this.repo.findOne({
      where: { id },
      relations: { company: true, courier: { user: true } },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    if (user.role === UserRole.COMPANY) await this.companies.assertAccess(job.companyId, user);
    if (user.role === UserRole.COURIER) {
      const courier = await this.couriers.getByUserId(user.id);
      if (job.courierId !== courier.id) throw new ForbiddenException();
    }
    const html = this.buildReceiptHtml(job);
    const b64 = Buffer.from(html, 'utf-8').toString('base64');
    return { jobId: id, url: `data:text/html;base64,${b64}` };
  }

  private buildReceiptHtml(job: JobEntity) {
    const fmt = (d?: Date | null) => (d ? new Date(d).toLocaleString('es-CO') : 'Pendiente');
    const from = [job.pickup.line1, job.pickup.city].filter(Boolean).join(', ');
    const to = [job.dropoff.line1, job.dropoff.city].filter(Boolean).join(', ');
    const courier = job.courier?.user?.fullName ?? 'Pendiente';
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Recibo VX-${job.id.slice(0, 6).toUpperCase()}</title>
<style>
  body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #111; }
  .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .label { color: #6b7280; }
  .total { font-size: 1.25rem; font-weight: 800; margin-top: 24px; text-align: right; }
</style>
</head>
<body>
  <div class="header">
    <h1>Vexa</h1>
    <p>Recibo de entrega · #VX-${job.id.slice(0, 6).toUpperCase()}</p>
  </div>
  <div class="row"><span class="label">Empresa</span><span>${job.company?.name ?? '-'}</span></div>
  <div class="row"><span class="label">Repartidor</span><span>${courier}</span></div>
  <div class="row"><span class="label">Recogida</span><span>${from}</span></div>
  <div class="row"><span class="label">Entrega</span><span>${to}</span></div>
  <div class="row"><span class="label">Distancia</span><span>${(job.distanceMeters ? (job.distanceMeters / 1000).toFixed(1) : '0')} km</span></div>
  <div class="row"><span class="label">Estado</span><span>${job.status}</span></div>
  <div class="row"><span class="label">Aceptado</span><span>${fmt(job.acceptedAt)}</span></div>
  <div class="row"><span class="label">Entregado</span><span>${fmt(job.completedAt)}</span></div>
  <div class="total">Total: $${job.price.toLocaleString('es-CO')} COP</div>
</body>
</html>`;
  }

  /** La empresa califica al repartidor de un pedido entregado. */
  async rate(id: string, dto: RateJobDto, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    if (job.status !== JobStatus.DELIVERED) {
      throw new BadRequestException('Solo se puede calificar un pedido entregado');
    }
    if (!job.courierId) throw new BadRequestException('El pedido no tiene repartidor asignado');
    job.ratingScore = dto.score;
    job.ratingComment = dto.comment ?? null;
    await this.couriers.applyRating(job.courierId, dto.score);
    return this.repo.save(job);
  }

  /** Historial del chat del pedido (solo participantes). */
  async listMessages(id: string, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    return this.messages.find({
      where: { jobId: job.id },
      order: { sentAt: 'ASC' },
      take: 200,
    });
  }

  async sendMessage(id: string, dto: SendMessageDto, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    const message = await this.messages.save(
      this.messages.create({ jobId: job.id, senderId: user.id, senderRole: user.role, body: dto.body }),
    );
    const event: JobMessageEvent = {
      jobId: job.id,
      senderId: user.id,
      senderRole: user.role,
      body: dto.body,
      sentAt: message.sentAt.toISOString(),
    };
    await this.redis.publish(RedisChannels.JOB_MESSAGE, event);
    return message;
  }

  private async assertAccess(job: JobEntity, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.COMPANY) return this.companies.assertAccess(job.companyId, user);
    const courier = await this.couriers.getByUserId(user.id);
    if (job.courierId && job.courierId !== courier.id) throw new ForbiddenException();
  }

  private assertTransition(job: JobEntity, next: JobStatus) {
    if (!ALLOWED_TRANSITIONS[job.status].includes(next)) {
      throw new BadRequestException(`Cannot move job from ${job.status} to ${next}`);
    }
  }

  private async computeDistance(jobId: string): Promise<number> {
    const [{ distance }] = await this.repo.query(
      'SELECT ST_Distance(pickup_point, dropoff_point)::int AS distance FROM jobs WHERE id = $1',
      [jobId]
    );
    return Number(distance);
  }

  private toJson(job: JobEntity) {
    return {
      ...job,
      createdAt: job.createdAt?.toISOString(),
      acceptedAt: job.acceptedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    };
  }
}
