import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

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
}
