import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUrl, IsUUID } from 'class-validator';
import { PaymentProvider } from '@vexa/shared';

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  jobId!: string;

  @ApiPropertyOptional({ enum: PaymentProvider, default: PaymentProvider.WOMPI })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider: PaymentProvider = PaymentProvider.WOMPI;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  redirectUrl?: string;
}
