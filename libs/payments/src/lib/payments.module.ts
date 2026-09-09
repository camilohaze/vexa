import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PAYMENT_PROVIDERS } from './interfaces/payment-provider.interface';
import { PaymentGatewayService } from './payments.service';
import { StripeConnectProvider } from './providers/stripe-connect.provider';
import { WompiProvider } from './providers/wompi.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    WompiProvider,
    StripeConnectProvider,
    {
      provide: PAYMENT_PROVIDERS,
      inject: [WompiProvider, StripeConnectProvider],
      useFactory: (...providers: unknown[]) => providers,
    },
    PaymentGatewayService,
  ],
  exports: [PaymentGatewayService],
})
export class PaymentsModule {}
