import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateMatchingEnv } from './config/env';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateMatchingEnv }),
    MatchingModule,
  ],
})
export class AppModule {}
