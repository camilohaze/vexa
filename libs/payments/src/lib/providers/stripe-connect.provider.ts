import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentProvider } from '@vexa/shared';
import {
  ChargeResult,
  CreateChargeInput,
  PaymentProviderPort,
  WebhookEvent,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeConnectProvider implements PaymentProviderPort {
  readonly provider = PaymentProvider.STRIPE_CONNECT;

  createCharge(_input: CreateChargeInput): Promise<ChargeResult> {
    throw new NotImplementedException('Stripe Connect integration pending');
  }

  getCharge(_providerReference: string): Promise<ChargeResult> {
    throw new NotImplementedException('Stripe Connect integration pending');
  }

  parseWebhook(): WebhookEvent {
    throw new NotImplementedException('Stripe Connect integration pending');
  }
}
