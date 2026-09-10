import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BaseEnv, validateEnv } from '@vexa/core';

const toInt = (value: unknown): number => (typeof value === 'number' ? value : parseInt(String(value), 10) || 0);

export class MatchingEnv extends BaseEnv {
  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(50_000)
  @Transform(({ value }) => toInt(value))
  MATCHING_RADIUS_METERS = 3000;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => toInt(value))
  MATCHING_MAX_CANDIDATES = 10;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Transform(({ value }) => toInt(value))
  MATCHING_OFFER_TTL_SECONDS = 45;
}

export const validateMatchingEnv = validateEnv(MatchingEnv);
