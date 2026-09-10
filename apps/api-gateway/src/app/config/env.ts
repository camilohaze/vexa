import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseEnv, validateEnv } from '@vexa/core';

const toBool = (value: unknown): boolean => value === 'true' || value === '1' || value === true || value === 1;

export class ApiGatewayEnv extends BaseEnv {
  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBool(value))
  DATABASE_SSL = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBool(value))
  DATABASE_SYNCHRONIZE = false;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL = '15m';

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL = '30d';

  @IsOptional()
  @IsString()
  OAUTH_CALLBACK_BASE_URL = 'http://localhost:3000/api/auth';

  @IsOptional()
  @IsString()
  WEB_LANDING_URL = 'http://localhost:4400';

  @IsOptional()
  @IsString()
  WEB_COMPANY_URL = 'http://localhost:4200';

  @IsOptional()
  @IsString()
  WEB_ADMIN_URL = 'http://localhost:4300';

  @IsOptional()
  @IsString()
  MOBILE_DEEP_LINK = 'vexa://auth/callback';

  @IsOptional()
  @IsString()
  CORS_ORIGINS = 'http://localhost:4200,http://localhost:4300';

  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET = 'vexa';

  @IsOptional()
  @IsString()
  R2_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  MAPBOX_TOKEN?: string;
}

export const validateApiGatewayEnv = validateEnv(ApiGatewayEnv);
