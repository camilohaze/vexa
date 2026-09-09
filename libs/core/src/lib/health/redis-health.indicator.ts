import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,
    private readonly health: HealthIndicatorService
  ) {}

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    try {
      const pong = await this.redis.client.ping();
      return pong === 'PONG' ? indicator.up() : indicator.down({ pong });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
