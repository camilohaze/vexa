import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthCheckService } from '@nestjs/terminus';
import { Public } from '@vexa/auth';
import { RedisHealthIndicator } from '@vexa/core';
import { ApiRoutes } from '@vexa/shared';

@ApiTags(ApiRoutes.HEALTH)
@Controller(ApiRoutes.HEALTH)
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
