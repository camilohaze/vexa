import { IsOptional, IsString } from 'class-validator';
import { BaseEnv, validateEnv } from '@vexa/core';

export class RealtimeEnv extends BaseEnv {
  @IsOptional()
  @IsString()
  CORS_ORIGINS = 'http://localhost:4200,http://localhost:4300';
}

export const validateRealtimeEnv = validateEnv(RealtimeEnv);
