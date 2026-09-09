import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';

@Module({
  imports: [TerminusModule],
  providers: [RedisHealthIndicator],
  exports: [TerminusModule, RedisHealthIndicator],
})
export class HealthModule {}
