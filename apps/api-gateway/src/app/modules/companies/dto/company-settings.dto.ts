import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsBoolean()
  @IsOptional()
  twoFactor?: boolean;

  @IsIn(['es', 'en'])
  @IsOptional()
  language?: 'es' | 'en';

  @IsIn(['COP', 'USD'])
  @IsOptional()
  currency?: 'COP' | 'USD';

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsNumber()
  @IsOptional()
  planPrice?: number;

  @IsDateString()
  @IsOptional()
  renewalAt?: string;
}
