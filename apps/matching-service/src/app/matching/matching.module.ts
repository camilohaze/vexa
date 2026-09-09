import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@vexa/core';
import { MatchingService } from './matching.service';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [MatchingService],
})
export class MatchingModule {}
