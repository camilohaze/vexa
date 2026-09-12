import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '@vexa/auth';
import { PaymentStatus, UserRole } from '@vexa/shared';
import { JobEntity } from '../jobs/job.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { CompanyEntity } from './company.entity';
import { CompanySettingsEntity } from './company-settings.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreatePaymentMethodDto } from './dto/payment-method.dto';
import { UpdateCompanySettingsDto } from './dto/company-settings.dto';
import { PaymentMethodEntity } from './payment-method.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repo: Repository<CompanyEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodsRepo: Repository<PaymentMethodEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(CompanySettingsEntity)
    private readonly settingsRepo: Repository<CompanySettingsEntity>
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getById(id: string) {
    const company = await this.repo.findOneBy({ id });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  findByOwner(ownerId: string) {
    return this.repo.findOneBy({ ownerId });
  }

  async getForUser(user: AuthenticatedUser) {
    const company = await this.findByOwner(user.id);
    if (!company) throw new ForbiddenException('User has no company');
    return company;
  }

  create(dto: CreateCompanyDto, ownerId: string) {
    return this.repo.save(this.repo.create({ ...dto, ownerId }));
  }

  /** Billetera de la empresa: gastos y saldo derivado de pagos. */
  async wallet(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    const rows = await this.payments
      .createQueryBuilder('p')
      .innerJoin(JobEntity, 'j', 'j.id = p.job_id')
      .select('p.status', 'status')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('j.company_id = :id', { id: company.id })
      .groupBy('p.status')
      .getRawMany<{ status: PaymentStatus; total: string }>();
    const sum = (s: PaymentStatus) =>
      Number(rows.find((r) => r.status === s)?.total ?? 0);
    const spent = sum(PaymentStatus.APPROVED);
    const pending = sum(PaymentStatus.PENDING);
    const refunded = sum(PaymentStatus.REFUNDED);
    return { spent, pending, refunded, balance: Math.max(0, refunded - spent * 0) };
  }

  /** Métodos de pago guardados de la empresa. */
  async paymentMethods(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    return this.paymentMethodsRepo.find({
      where: { companyId: company.id },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addPaymentMethod(user: AuthenticatedUser, dto: CreatePaymentMethodDto) {
    const company = await this.getForUser(user);
    if (dto.isDefault) {
      await this.paymentMethodsRepo.update({ companyId: company.id }, { isDefault: false });
    }
    return this.paymentMethodsRepo.save(
      this.paymentMethodsRepo.create({ companyId: company.id, ...dto })
    );
  }

  async setDefaultPaymentMethod(user: AuthenticatedUser, id: string) {
    const company = await this.getForUser(user);
    const exists = await this.paymentMethodsRepo.findOneBy({ id, companyId: company.id });
    if (!exists) throw new NotFoundException('Payment method not found');
    await this.paymentMethodsRepo.update({ companyId: company.id }, { isDefault: false });
    exists.isDefault = true;
    return this.paymentMethodsRepo.save(exists);
  }

  async removePaymentMethod(user: AuthenticatedUser, id: string) {
    const company = await this.getForUser(user);
    const result = await this.paymentMethodsRepo.delete({ id, companyId: company.id });
    return { removed: result.affected === 1 };
  }

  /** Notificaciones reales del feed de la empresa. */
  async notifications(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    const rows = await this.notificationRepo.find({
      where: { scope: 'company', companyId: company.id },
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

  /** Movimientos de la billetera: pagos por pedido + reembolsos. */
  async transactions(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    const rows = await this.payments
      .createQueryBuilder('p')
      .innerJoin(JobEntity, 'j', 'j.id = p.job_id')
      .select('p.id', 'id')
      .addSelect('p.reference', 'reference')
      .addSelect('p.amount', 'amount')
      .addSelect('p.status', 'status')
      .addSelect('p.created_at', 'at')
      .addSelect('j.id', 'jobId')
      .where('j.company_id = :id', { id: company.id })
      .orderBy('p.created_at', 'DESC')
      .limit(50)
      .getRawMany<{ id: string; reference: string; amount: string; status: PaymentStatus; at: Date; jobId: string }>();
    return rows.map((r) => ({
      id: r.id,
      title:
        r.status === PaymentStatus.REFUNDED
          ? `Reembolso VX-${r.jobId.slice(0, 6).toUpperCase()}`
          : `Débito envío VX-${r.jobId.slice(0, 6).toUpperCase()}`,
      at: r.at,
      amount: r.status === PaymentStatus.REFUNDED ? Number(r.amount) : -Number(r.amount),
      status: r.status,
    }));
  }

  /** Facturas mensuales agregadas a partir de pagos aprobados. */
  async invoices(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    return this.payments
      .createQueryBuilder('p')
      .innerJoin(JobEntity, 'j', 'j.id = p.job_id')
      .select("to_char(date_trunc('month', p.created_at), 'YYYY-MM')", 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(p.amount)', 'total')
      .where('j.company_id = :id', { id: company.id })
      .andWhere('p.status = :st', { st: PaymentStatus.APPROVED })
      .groupBy("date_trunc('month', p.created_at)")
      .orderBy("date_trunc('month', p.created_at)", 'DESC')
      .getRawMany();
  }

  async updateFcmToken(user: AuthenticatedUser, fcmToken: string) {
    const company = await this.getForUser(user);
    company.fcmToken = fcmToken;
    return this.repo.save(company);
  }

  async assertAccess(companyId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;
    const company = await this.getById(companyId);
    if (company.ownerId !== user.id) throw new ForbiddenException();
  }

  async settings(user: AuthenticatedUser) {
    const company = await this.getForUser(user);
    let settings = await this.settingsRepo.findOneBy({ companyId: company.id });
    if (!settings) {
      settings = this.settingsRepo.create({ companyId: company.id });
    }
    if (!settings.plan) {
      settings.plan = 'Estándar';
      settings.planPrice = 299;
      settings.renewalAt = new Date(Date.now() + 30 * 86400000);
    }
    await this.settingsRepo.save(settings);
    return { ...settings, name: company.name, taxId: company.taxId };
  }

  async updateSettings(user: AuthenticatedUser, dto: UpdateCompanySettingsDto) {
    const company = await this.getForUser(user);
    let settings = await this.settingsRepo.findOneBy({ companyId: company.id });
    if (!settings) {
      settings = this.settingsRepo.create({ companyId: company.id });
    }
    Object.assign(settings, dto);
    await this.settingsRepo.save(settings);
    return { ...settings, name: company.name, taxId: company.taxId };
  }
}
