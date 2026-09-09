import { PaymentProvider, PaymentStatus } from '@vexa/shared';

export interface CreateChargeInput {
  jobId: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  redirectUrl?: string;
  reference: string;
}

export interface ChargeResult {
  provider: PaymentProvider;
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  raw?: unknown;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  reference: string;
  providerReference: string;
  status: PaymentStatus;
  amountInCents: number;
  currency: string;
  raw: unknown;
}

export interface PaymentProviderPort {
  readonly provider: PaymentProvider;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  getCharge(providerReference: string): Promise<ChargeResult>;
  parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): WebhookEvent;
}

export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
