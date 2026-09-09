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
  JobAcceptedEvent,
  JobCancelledEvent,
  JobCompletedEvent,
  JobMessageEvent,
  JobStatus,
  Paginated,
  RedisChannels,
  UserRole,
} from '@vexa/shared';
import { CompaniesService } from '../companies/companies.service';
import { CouriersService } from '../couriers/couriers.service';
import { CancelJobDto, CompleteJobDto, CreateJobDto, ListJobsQueryDto, RateJobDto, SendMessageDto } from './dto';
import { JobEntity } from './job.entity';
import { JobMessageEntity } from './message.entity';

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
    private readonly dataSource: DataSource,
    private readonly companies: CompaniesService,
    private readonly couriers: CouriersService,
    private readonly redis: RedisService
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
    return this.repo.save(job);
  }

  async complete(id: string, dto: CompleteJobDto, user: AuthenticatedUser) {
    const job = await this.getById(id, user);
    this.assertTransition(job, JobStatus.DELIVERED);
    job.status = JobStatus.DELIVERED;
    job.completedAt = new Date();
    job.proofOfDeliveryUrl = dto.proofOfDeliveryUrl;
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

  /** Tarifa sugerida: base + km + peso, multiplicador express. */
  priceEstimate(distanceMeters: number, weightKg = 0, priority: 'standard' | 'express' = 'standard') {
    const base = 8000; // COP
    const perKm = 1500;
    const perKg = 500;
    const km = distanceMeters / 1000;
    let price = base + perKm * km + perKg * weightKg;
    if (priority === 'express') price *= 1.35;
    return {
      currency: 'COP',
      distanceMeters,
      breakdown: {
        base,
        distance: Math.round(perKm * km),
        weight: Math.round(perKg * weightKg),
        priorityMultiplier: priority === 'express' ? 1.35 : 1,
      },
      price: Math.round(price / 100) * 100,
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
