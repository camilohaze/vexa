import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { PaymentProvider, PaymentStatus } from '@vexa/shared';
import {
  ChargeResult,
  CreateChargeInput,
  PaymentProviderPort,
  WebhookEvent,
} from '../interfaces/payment-provider.interface';

interface WompiTransaction {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  reference: string;
  amount_in_cents: number;
  currency: string;
}

interface WompiWebhookBody {
  event: string;
  data: { transaction: WompiTransaction };
  signature: { checksum: string; properties: string[] };
  timestamp: number;
}

const STATUS_MAP: Record<WompiTransaction['status'], PaymentStatus> = {
  PENDING: PaymentStatus.PENDING,
  APPROVED: PaymentStatus.APPROVED,
  DECLINED: PaymentStatus.DECLINED,
  VOIDED: PaymentStatus.REFUNDED,
  ERROR: PaymentStatus.ERROR,
};

@Injectable()
export class WompiProvider implements PaymentProviderPort {
  readonly provider = PaymentProvider.WOMPI;
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;
  private readonly eventsSecret: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('WOMPI_BASE_URL', 'https://sandbox.wompi.co/v1');
    this.publicKey = config.get<string>('WOMPI_PUBLIC_KEY', '');
    this.privateKey = config.get<string>('WOMPI_PRIVATE_KEY', '');
    this.integritySecret = config.get<string>('WOMPI_INTEGRITY_SECRET', '');
    this.eventsSecret = config.get<string>('WOMPI_EVENTS_SECRET', '');
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const signature = createHash('sha256')
      .update(`${input.reference}${input.amountInCents}${input.currency}${this.integritySecret}`)
      .digest('hex');
    const params = new URLSearchParams({
      'public-key': this.publicKey,
      currency: input.currency,
      'amount-in-cents': String(input.amountInCents),
      reference: input.reference,
      'signature:integrity': signature,
      'customer-data:email': input.customerEmail,
      ...(input.redirectUrl ? { 'redirect-url': input.redirectUrl } : {}),
    });
    return {
      provider: this.provider,
      providerReference: input.reference,
      status: PaymentStatus.PENDING,
      checkoutUrl: `https://checkout.wompi.co/p/?${params.toString()}`,
    };
  }

  async getCharge(providerReference: string): Promise<ChargeResult> {
    const res = await fetch(`${this.baseUrl}/transactions/${providerReference}`, {
      headers: { Authorization: `Bearer ${this.privateKey}` },
    });
    if (!res.ok) throw new BadRequestException(`Wompi responded ${res.status}`);
    const { data } = (await res.json()) as { data: WompiTransaction };
    return {
      provider: this.provider,
      providerReference: data.id,
      status: STATUS_MAP[data.status],
      raw: data,
    };
  }

  parseWebhook(_headers: Record<string, string | string[] | undefined>, body: unknown): WebhookEvent {
    const event = body as WompiWebhookBody;
    const tx = event?.data?.transaction;
    if (!tx || !event.signature) throw new BadRequestException('Malformed Wompi webhook');

    const concatenated = event.signature.properties
      .map((path) => path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], event.data))
      .join('');
    const expected = createHash('sha256')
      .update(`${concatenated}${event.timestamp}${this.eventsSecret}`)
      .digest('hex');
    if (expected !== event.signature.checksum) throw new UnauthorizedException('Invalid Wompi signature');

    return {
      provider: this.provider,
      reference: tx.reference,
      providerReference: tx.id,
      status: STATUS_MAP[tx.status],
      amountInCents: tx.amount_in_cents,
      currency: tx.currency,
      raw: event,
    };
  }
}
