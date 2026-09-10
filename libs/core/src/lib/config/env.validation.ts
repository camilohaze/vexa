import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class BaseEnv {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => (typeof value === 'number' ? value : parseInt(String(value), 10) || 3000))
  PORT = 3000;

  @IsString()
  REDIS_URL = 'redis://localhost:6379';

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  OTEL_SERVICE_NAME?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
}

export function validateEnv<T extends object>(cls: new () => T) {
  return (raw: Record<string, unknown>): T => {
    const parsed = plainToInstance(cls, raw, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });
    const errors = validateSync(parsed, { skipMissingProperties: false });
    if (errors.length) {
      const details = errors
        .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n');
      throw new Error(`Invalid environment configuration:\n${details}`);
    }
    return parsed;
  };
}
