import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '@vexa/shared';
import {
  CreateChargeInput,
  PAYMENT_PROVIDERS,
  PaymentProviderPort,
} from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentGatewayService {
  private readonly providers: Map<PaymentProvider, PaymentProviderPort>;

  constructor(@Inject(PAYMENT_PROVIDERS) providers: PaymentProviderPort[]) {
    this.providers = new Map(providers.map((p) => [p.provider, p]));
  }

  resolve(provider: PaymentProvider): PaymentProviderPort {
    const found = this.providers.get(provider);
    if (!found) throw new NotFoundException(`Payment provider ${provider} not registered`);
    return found;
  }

  createCharge(provider: PaymentProvider, input: CreateChargeInput) {
    return this.resolve(provider).createCharge(input);
  }

  parseWebhook(
    provider: PaymentProvider,
    headers: Record<string, string | string[] | undefined>,
    body: unknown
  ) {
    return this.resolve(provider).parseWebhook(headers, body);
  }
}
