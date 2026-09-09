import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsIn(['card', 'bank', 'wallet'])
  methodType!: 'card' | 'bank' | 'wallet';

  @IsString()
  label!: string;

  @IsString()
  @IsOptional()
  sub?: string;

  @IsString()
  @IsOptional()
  last4?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
