import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateCompanySettingsDto {
  @ValidateIf((o) => !!o.adminEmail)
  @IsEmail()
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
  timezone?: string;

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
