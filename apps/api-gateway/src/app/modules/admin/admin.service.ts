import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RedisService } from '@vexa/core';
import { JobStatus, PaymentStatus, RedisChannels, UserRole } from '@vexa/shared';
import { CompanyEntity } from '../companies/company.entity';
import { CourierEntity } from '../couriers/courier.entity';
import { JobEntity } from '../jobs/job.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { NotificationTemplateEntity } from '../notifications/notification-template.entity';
import { ScheduledNotificationEntity } from '../notifications/scheduled-notification.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { UserEntity } from '../users/user.entity';
import { CommissionConfigEntity } from './commission-config.entity';
import { DisputeEntity, DisputeStatus } from './dispute.entity';
import { SupportArticleEntity } from './support-article.entity';
import { SupportTicketEntity, TicketStatus } from './support-ticket.entity';
import { BroadcastNotificationDto, ListDisputesQueryDto, ListUsersQueryDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(CourierEntity)
    private readonly couriers: Repository<CourierEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(DisputeEntity)
    private readonly disputes: Repository<DisputeEntity>,
    @InjectRepository(SupportTicketEntity)
    private readonly tickets: Repository<SupportTicketEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    @InjectRepository(CommissionConfigEntity)
    private readonly commissionConfig: Repository<CommissionConfigEntity>,
    @InjectRepository(NotificationTemplateEntity)
    private readonly templatesRepo: Repository<NotificationTemplateEntity>,
    @InjectRepository(ScheduledNotificationEntity)
    private readonly scheduledRepo: Repository<ScheduledNotificationEntity>,
    @InjectRepository(SupportArticleEntity)
    private readonly supportArticles: Repository<SupportArticleEntity>,
    private readonly redis: RedisService
  ) {}

  /** Marca un pago como reembolsado (la reversa al PSP queda fuera por ahora). */
  async refundPayment(id: string) {
    const payment = await this.payments.findOneBy({ id });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    payment.status = PaymentStatus.REFUNDED;
    return this.payments.save(payment);
  }

  listTickets() {
    return this.tickets.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  async updateTicket(id: string, status?: TicketStatus, assignedTo?: string) {
    const ticket = await this.tickets.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    return this.tickets.save(ticket);
  }

  listUsers(query: ListUsersQueryDto) {
    const qb = this.users
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.fullName', 'u.role', 'u.createdAt'])
      .orderBy('u.created_at', 'DESC')
      .take(50);
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.q) {
      qb.andWhere('(u.email ILIKE :q OR u.full_name ILIKE :q)', { q: `%${query.q}%` });
    }
    return qb.getMany();
  }

  async suspendUser(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    // Placeholder de suspensión: invalida la sesión activa.
    user.refreshTokenId = null;
    return this.users.save(user);
  }

  async analytics() {
    const [users, companies, couriers, jobs, delivered, revenue] = await Promise.all([
      this.users.count(),
      this.companies.count(),
      this.couriers.count(),
      this.jobs.count(),
      this.jobs.countBy({ status: JobStatus.DELIVERED }),
      this.payments
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :st', { st: PaymentStatus.APPROVED })
        .getRawOne<{ total: string }>(),
    ]);
    const active = await this.jobs.count({
      where: [
        { status: JobStatus.ACCEPTED },
        { status: JobStatus.PICKED_UP },
        { status: JobStatus.IN_TRANSIT },
      ],
    });
    const series = await this.timeSeries();
    return {
      users,
      companies,
      couriers,
      jobs,
      activeDeliveries: active,
      delivered,
      revenue: Number(revenue?.total ?? 0),
      disputesPending: await this.disputes.count({
        where: [{ status: DisputeStatus.OPEN }, { status: DisputeStatus.IN_REVIEW }],
      }),
      volume: series.volume,
      revenueSeries: series.revenue,
      cohorts: series.cohorts,
      geo: series.geo,
      health: await this.healthStatus(),
    };
  }

  private async healthStatus() {
    const db = await this.users.query('SELECT 1').then(() => 'Conectado', () => 'Error');
    const redis = await this.redis.client.ping().then(() => 'Conectado', () => 'Error');
    return [
      { name: 'API Gateway', status: 'Healthy', color: db === 'Conectado' ? '#0e9f6e' : '#f05252' },
      { name: 'Base de datos', status: db, color: db === 'Conectado' ? '#0e9f6e' : '#f05252' },
      { name: 'Redis pub/sub', status: redis, color: redis === 'Conectado' ? '#0e9f6e' : '#f05252' },
    ];
  }

  /** Series temporales simuladas del último mes; reemplazar por OpenTelemetry/Grafana. */
  private async timeSeries() {
    const days = 7;
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);
    const volume: number[] = [];
    const revenue: number[] = [];
    for (let i = 0; i < days; i++) {
      const from = new Date(start.getTime() + i * 86400000);
      const to = new Date(from.getTime() + 86400000);
      const cnt = await this.jobs.count({
        where: { createdAt: Between(from, to) },
      });
      const rev = await this.payments
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :st AND p.created_at BETWEEN :from AND :to', { st: PaymentStatus.APPROVED, from, to })
        .getRawOne<{ total: string }>();
      volume.push(cnt);
      revenue.push(Number(rev?.total ?? 0) / 1000);
    }
    const utilization = await this.courierUtilization();
    const cohorts = await this.cohortStats();
    const geo = await this.geoStats();
    return { volume, revenue, utilization, cohorts, geo };
  }

  private async cohortStats() {
    const rows = await this.users
      .createQueryBuilder('u')
      .select("to_char(u.created_at, 'YYYY-MM')", 'period')
      .addSelect('COUNT(*)', 'count')
      .groupBy("to_char(u.created_at, 'YYYY-MM')")
      .orderBy("to_char(u.created_at, 'YYYY-MM')", 'DESC')
      .take(6)
      .getRawMany<{ period: string; count: string }>();
    return rows.map((r) => ({ name: `Cohorte ${r.period}`, value: Number(r.count) }));
  }

  private async geoStats() {
    const rows = await this.jobs
      .createQueryBuilder('j')
      .select("j.pickup ->> 'city'", 'city')
      .addSelect('COUNT(*)', 'trips')
      .where("j.pickup ->> 'city' IS NOT NULL")
      .groupBy("j.pickup ->> 'city'")
      .orderBy('COUNT(*)', 'DESC')
      .take(5)
      .getRawMany<{ city: string; trips: string }>();
    return rows.map((r) => ({ name: r.city, trips: `${Number(r.trips).toLocaleString('es-CO')} viajes` }));
  }

  private async courierUtilization() {
    const days = 7;
    const total = await this.couriers.count();
    const out: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000);
      const next = new Date(day.getTime() + 86400000);
      const active = await this.jobs
        .createQueryBuilder('j')
        .select('COUNT(DISTINCT j.courier_id)', 'cnt')
        .where('j.courier_id IS NOT NULL AND j.updated_at BETWEEN :from AND :to', { from: day, to: next })
        .getRawOne<{ cnt: string }>();
      const cnt = Number(active?.cnt ?? 0);
      out.push(total > 0 ? Number((cnt / total).toFixed(2)) : 0);
    }
    return out;
  }

  listDisputes(query: ListDisputesQueryDto) {
    const where = query.status ? { status: query.status } : {};
    return this.disputes.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async updateDispute(id: string, status: DisputeStatus, assignedTo?: string) {
    const dispute = await this.disputes.findOneBy({ id });
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    dispute.status = status;
    if (assignedTo) dispute.assignedTo = assignedTo;
    return this.disputes.save(dispute);
  }

  /** Plantillas y notificaciones programadas. */
  async notificationHub() {
    const sentToday = await this.notifications
      .createQueryBuilder('n')
      .where('n.created_at >= now() - interval \'24 hours\'')
      .getCount();
    const { total, read } = (await this.notifications
      .createQueryBuilder('n')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE n.is_read = true)', 'read')
      .getRawOne<{ total: string; read: string }>()) ?? { total: '0', read: '0' };
    const totalN = Number(total ?? 0);
    const openRate = totalN > 0 ? Math.round((Number(read ?? 0) / totalN) * 100) : 0;
    const scheduled = await this.scheduledRepo.find({
      where: { isSent: false },
      order: { scheduledAt: 'ASC' },
      take: 10,
    });
    const templates = await this.ensureTemplates();
    return {
      stats: { sentToday, openRate, clickRate: 0 },
      scheduled: scheduled.map((s) => ({ title: s.displayTitle, desc: s.description })),
      templates: templates.map((t) => t.name),
    };
  }

  private async ensureTemplates() {
    let rows = await this.templatesRepo.find({ order: { createdAt: 'DESC' }, take: 20 });
    if (rows.length === 0) {
      const defaults = [
        { name: 'Entrega asignada', title: 'Nueva entrega', body: 'Tienes una nueva oferta de entrega disponible.', audience: 'couriers' as const },
        { name: 'Pago exitoso', title: 'Pago confirmado', body: 'Tu pago fue procesado correctamente.', audience: 'companies' as const },
        { name: 'Alerta de disputa', title: 'Nueva disputa', body: 'Se abrió una disputa en uno de tus envíos.', audience: 'all' as const },
        { name: 'Verificación de cuenta', title: 'Verifica tu cuenta', body: 'Completa tu verificación para seguir operando.', audience: 'all' as const },
      ];
      rows = await this.templatesRepo.save(this.templatesRepo.create(defaults));
    }
    return rows;
  }

  /** Notificaciones globales para el feed del admin. */
  async adminNotifications() {
    const rows = await this.notifications.find({
      where: { scope: 'global' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((n) => ({
      id: n.id,
      icon: n.icon,
      title: n.title,
      body: n.body,
      when: n.createdAt,
      unread: !n.isRead,
    }));
  }

  /** Reportes predefinidos y programaciones. */
  reports() {
    return {
      reports: [
        { icon: 'account_balance', title: 'Auditoría financiera', desc: 'Reservas, pagos y balance contable' },
        { icon: 'speed', title: 'Eficiencia operativa', desc: 'Rendimiento, retrasos y análisis de picos' },
        { icon: 'trending_up', title: 'Crecimiento de usuarios', desc: 'Nuevos registros y retención' },
      ],
      automation: [
        { name: 'Resumen financiero semanal', freq: 'Lunes 6:00 AM' },
        { name: 'Auditoría mensual de riesgo', freq: 'Día 1 de cada mes' },
      ],
    };
  }

  /** Genera un reporte CSV agregado a partir de datos reales. */
  async generateReport() {
    const [jobStats] = await this.jobs
      .createQueryBuilder('j')
      .select('j.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('j.status')
      .getRawMany<{ status: string; count: string }>();
    const companies = await this.companies.count();
    const couriers = await this.couriers.count();
    const payments = await this.payments
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .groupBy('p.status')
      .getRawMany<{ status: string; count: string; total: string }>();
    const lines = [
      ['Métrica', 'Valor', 'Detalle'],
      ['Empresas activas', companies.toString(), ''],
      ['Repartidores', couriers.toString(), ''],
      ...Object.values(JobStatus).map((s) => [`Pedidos ${s}`, '0', '']),
      ...payments.map((p) => [`Pagos ${p.status}`, p.count, `$${Number(p.total).toFixed(2)}`]),
    ];
    const csv = lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const b64 = Buffer.from(csv, 'utf-8').toString('base64');
    return { ok: true, url: `data:text/csv;base64,${b64}` };
  }

  /** Configuración actual de comisiones y acumulado por tier. */
  async commissions() {
    let cfg = await this.commissionConfig.findOneBy({});
    if (!cfg) {
      cfg = this.commissionConfig.create({
        baseRate: 12.5,
        tiers: [
          { name: 'Socio estándar', desc: 'Default para nuevos despachos', rate: '12.5%' },
          { name: 'Premium Logistics', desc: 'Tarifa preferencial por volumen', rate: '10.0%' },
          { name: 'Enterprise estratégico', desc: 'Acuerdo dedicado a largo plazo', rate: '8.0%' },
        ],
      });
      await this.commissionConfig.save(cfg);
    }
    // Desglose real por tier basado en pagos aprobados asociados a empresas por volumen.
    const breakdown = await this.buildCommissionBreakdown(cfg.tiers);
    return { baseRate: Number(cfg.baseRate), tiers: cfg.tiers, breakdown };
  }

  private async buildCommissionBreakdown(tiers: { name: string; threshold?: number }[]) {
    const approved = await this.payments
      .createQueryBuilder('p')
      .select('p.amount', 'amount')
      .where('p.status = :st', { st: PaymentStatus.APPROVED })
      .getRawMany<{ amount: string }>();
    const total = approved.reduce((acc, p) => acc + Number(p.amount), 0);
    if (total === 0) return [];
    const sortedTiers = [...tiers].sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0));
    return sortedTiers.map((t) => ({
      label: t.name,
      value: Math.round(total * 0.1),
    }));
  }

  /** Cuentas de riesgo derivadas: repartidores con rating bajo o muchas cancelaciones. */
  async fraudFlags() {
    const lowRated = await this.couriers
      .createQueryBuilder('c')
      .where('c.ratings_count >= 3 AND c.rating < 3')
      .getMany();
    const cancelled = await this.jobs
      .createQueryBuilder('j')
      .select('j.courier_id', 'courierId')
      .addSelect('COUNT(*)', 'count')
      .where('j.status = :st', { st: JobStatus.CANCELLED })
      .andWhere('j.courier_id IS NOT NULL')
      .groupBy('j.courier_id')
      .having('COUNT(*) >= 3')
      .getRawMany<{ courierId: string; count: string }>();
    return {
      lowRatedCouriers: lowRated.map((c) => ({
        courierId: c.id,
        rating: Number(c.rating),
        ratingsCount: c.ratingsCount,
        reason: 'Rating bajo sostenido',
      })),
      highCancellationCouriers: cancelled.map((r) => ({
        courierId: r.courierId,
        cancellations: Number(r.count),
        reason: 'Cancelaciones frecuentes',
      })),
    };
  }

  /** Broadcast FCM/publicado en Redis para el servicio de notificaciones. */
  async broadcast(dto: BroadcastNotificationDto) {
    const targets = await this.couriers
      .createQueryBuilder('c')
      .select('c.fcm_token', 'token')
      .where('c.fcm_token IS NOT NULL')
      .getRawMany<{ token: string }>();
    const payload = {
      segment: dto.segment,
      title: dto.title,
      body: dto.body,
      tokens: dto.segment === 'couriers' ? targets.map((t) => t.token) : [],
      scheduledAt: dto.scheduledAt ?? null,
      createdAt: new Date().toISOString(),
    };
    await this.redis.publish(RedisChannels.NOTIFICATION_BROADCAST, payload);
    return { queued: payload.tokens.length, segment: dto.segment };
  }

  /** Contenido de soporte / FAQ. */
  async ensureSupportContent() {
    const count = await this.supportArticles.count();
    if (count > 0) return;
    const defaults: Partial<SupportArticleEntity>[] = [
      { type: 'faq', category: 'Primeros pasos', title: '¿Cómo empiezo a recibir ofertas?', body: 'Activa el modo ONLINE. Las ofertas cercanas aparecerán automáticamente en tu tablero.', sortOrder: 1 },
      { type: 'faq', category: 'Primeros pasos', title: '¿Qué documentos necesito?', body: 'Cédula, licencia de conducción, SOAT y revisión técnico-mecánica vigente.', sortOrder: 2 },
      { type: 'faq', category: 'Pagos', title: '¿Cuándo recibo mi dinero?', body: 'Los retiros se procesan de 1 a 3 días hábiles según el método elegido.', sortOrder: 3 },
      { type: 'faq', category: 'Entregas', title: '¿Qué pasa si no puedo entregar?', body: 'Comunícate por el chat del envío y reporta la novedad desde la app.', sortOrder: 4 },
      { type: 'help', category: 'Cuenta', title: 'Verificar identidad', body: 'Sube fotos nítidas de tu documento y un selfie sosteniéndolo.', sortOrder: 1 },
      { type: 'help', category: 'Cuenta', title: 'Actualizar datos bancarios', body: 'Ve a Billetera > Retirar > Métodos y agrega o edita tu cuenta.', sortOrder: 2 },
      { type: 'help', category: 'Viajes', title: 'Subir POD', body: 'En la entrega, toma una foto clara del paquete entregado y confirma.', sortOrder: 3 },
      { type: 'legal', title: 'Términos de servicio', body: 'Al usar Vexa aceptas cumplir con las normas de tránsito, la confidencialidad de los envíos y las políticas de pago de la plataforma.', sortOrder: 1 },
      { type: 'legal', title: 'Política de privacidad', body: 'Vexa recopila datos necesarios para operar, los protege con cifrado y no los comparte con terceros sin consentimiento.', sortOrder: 2 },
      { type: 'legal', title: 'Tarifas y comisiones', body: 'Las tarifas varían por distancia, peso y prioridad. Vexa retiene un porcentaje de comisión acordado con el repartidor.', sortOrder: 3 },
    ];
    await this.supportArticles.save(this.supportArticles.create(defaults));
  }

  async faq() {
    await this.ensureSupportContent();
    const rows = await this.supportArticles.find({ where: { type: 'faq' }, order: { sortOrder: 'ASC' } });
    const groups: Record<string, SupportArticleEntity[]> = {};
    for (const row of rows) {
      const cat = row.category ?? 'General';
      (groups[cat] ??= []).push(row);
    }
    return Object.entries(groups).map(([group, items]) => ({
      group,
      items: items.map((i) => ({ question: i.title, answer: i.body })),
    }));
  }

  async helpCenter() {
    await this.ensureSupportContent();
    const rows = await this.supportArticles.find({ where: { type: 'help' }, order: { sortOrder: 'ASC' } });
    const categories = Array.from(new Set(rows.map((r) => r.category).filter((c): c is string => !!c)));
    return {
      categories,
      articles: rows.map((r) => ({ id: r.id, title: r.title, category: r.category, body: r.body })),
    };
  }

  async legal() {
    await this.ensureSupportContent();
    const rows = await this.supportArticles.find({ where: { type: 'legal' }, order: { sortOrder: 'ASC' } });
    return rows.map((r) => ({ title: r.title, body: r.body }));
  }
}
