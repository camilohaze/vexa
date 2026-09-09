import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateRealtimeEnv } from './config/env';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateRealtimeEnv }),
    RealtimeModule,
  ],
})
export class AppModule {}
