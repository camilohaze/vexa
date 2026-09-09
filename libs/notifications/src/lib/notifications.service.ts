import { Injectable } from '@nestjs/common';
import { Job } from '@vexa/shared';
import { FcmService } from './fcm.service';

export const NotificationTypes = {
  NEW_OFFER: 'NEW_OFFER',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
} as const;

@Injectable()
export class NotificationsService {
  constructor(private readonly fcm: FcmService) {}

  notifyNewOffer(tokens: string[], job: Job) {
    return this.fcm.sendToTokens(tokens, {
      title: 'Nueva oferta de entrega',
      body: `${job.pickup.city}: ${job.pickup.line1} → ${job.dropoff.line1}`,
      data: { type: NotificationTypes.NEW_OFFER, jobId: job.id },
    });
  }

  notifyOfferAccepted(token: string, job: Job, courierName: string) {
    return this.fcm.sendToToken(token, {
      title: 'Oferta aceptada',
      body: `${courierName} aceptó tu pedido`,
      data: { type: NotificationTypes.OFFER_ACCEPTED, jobId: job.id },
    });
  }

  notifyPaymentReceived(token: string, amount: number, currency: string, jobId: string) {
    return this.fcm.sendToToken(token, {
      title: 'Pago recibido',
      body: `Recibiste ${amount.toLocaleString('es-CO')} ${currency}`,
      data: { type: NotificationTypes.PAYMENT_RECEIVED, jobId },
    });
  }
}
