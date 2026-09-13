import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '@vexa/auth';
import { PaymentGatewayService, WebhookEvent } from '@vexa/payments';
import { NotificationsService } from '@vexa/notifications';
import { PaymentProvider, PaymentStatus } from '@vexa/shared';
import { CompaniesService } from '../companies/companies.service';
import { JobEntity } from '../jobs/job.entity';
import { JobsService } from '../jobs/jobs.service';
import { NotificationsService as InAppNotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto';
import { PaymentEntity } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
    private readonly gateway: PaymentGatewayService,
    private readonly companies: CompaniesService,
    private readonly jobs: JobsService,
    private readonly notifications: NotificationsService,
    private readonly inAppNotifications: InAppNotificationsService
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreatePaymentDto, user: AuthenticatedUser) {
    const job = await this.jobs.getById(dto.jobId, user);
    await this.companies.getById(job.companyId);
    const amountInCents = Math.round(Number(job.price) * 100);
    const reference = `VEXA-${job.id.slice(0, 8)}-${Date.now()}`;

    const charge = await this.gateway.createCharge(dto.provider, {
      jobId: job.id,
      amountInCents,
      currency: 'COP',
      customerEmail: user.email,
      redirectUrl: dto.redirectUrl,
      reference,
    });

    return this.repo.save(
      this.repo.create({
        jobId: job.id,
        provider: dto.provider,
        reference,
        providerReference: charge.providerReference,
        amount: Number(job.price),
        currency: 'COP',
        status: charge.status,
        checkoutUrl: charge.checkoutUrl,
      })
    );
  }

  /** Reembolso manual ejecutado por un administrador. */
  async refund(id: string, reason?: string) {
    const payment = await this.repo.findOneBy({ id });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    if (payment.status !== PaymentStatus.APPROVED) {
      return payment;
    }
    payment.status = PaymentStatus.REFUNDED;
    payment.raw = { ...(payment.raw as object ?? {}), refundReason: reason, refundedAt: new Date().toISOString() };
    return this.repo.save(payment);
  }

  async handleWebhook(provider: PaymentProvider, event: WebhookEvent) {
    const payment = await this.repo.findOneBy({ reference: event.reference });
    if (!payment) throw new NotFoundException(`Payment ${event.reference} not found`);
    if (payment.status === PaymentStatus.APPROVED) return payment;

    payment.status = event.status;
    payment.providerReference = event.providerReference;
    payment.raw = event.raw;
    const saved = await this.repo.save(payment);

    if (event.status === PaymentStatus.APPROVED) {
      await this.notifyPayer(saved);
    }
    return saved;
  }

  private readonly copFormat = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  private async notifyPayer(payment: PaymentEntity) {
    const job = await this.repo.manager.findOne(JobEntity, {
      where: { id: payment.jobId },
      relations: { courier: true },
    });
    if (job?.courier?.fcmToken) {
      await this.notifications.notifyPaymentReceived(
        job.courier.fcmToken,
        Number(payment.amount),
        payment.currency,
        payment.jobId
      );
    }
    if (job) {
      try {
        await this.inAppNotifications.create({
          scope: 'company',
          companyId: job.companyId,
          icon: 'payments',
          title: 'Pago aprobado',
          body: `Tu pago de ${this.copFormat.format(Number(payment.amount))} por el envío #VX-${job.id.slice(0, 6).toUpperCase()} fue aprobado.`,
          referenceId: job.id,
          referenceType: 'payment',
        });
      } catch {
        // Un fallo al notificar no debe afectar el estado del pago.
      }
    }
  }
}
