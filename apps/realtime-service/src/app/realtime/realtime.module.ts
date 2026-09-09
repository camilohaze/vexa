import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@vexa/auth';
import { RedisModule } from '@vexa/core';
import { RealtimeGateway } from './realtime.gateway';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [ConfigModule, RedisModule, AuthModule.forRoot()],
  providers: [RealtimeGateway, WsJwtGuard],
})
export class RealtimeModule {}
