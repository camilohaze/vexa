import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BaseEnv, validateEnv } from '@vexa/core';

export class MatchingEnv extends BaseEnv {
  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(50_000)
  MATCHING_RADIUS_METERS = 3000;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  MATCHING_MAX_CANDIDATES = 10;

  @IsOptional()
  @IsInt()
  @Min(10)
  MATCHING_OFFER_TTL_SECONDS = 45;
}

export const validateMatchingEnv = validateEnv(MatchingEnv);
