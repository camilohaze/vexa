import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule, JwtAuthGuard, RolesGuard } from '@vexa/auth';
import { HealthModule, RedisModule } from '@vexa/core';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { validateApiGatewayEnv } from './config/env';
import { HealthController } from './health/health.controller';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule as AuthFeatureModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateApiGatewayEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    RedisModule,
    HealthModule,
    AuthModule.forRoot({ oauthProviders: true }),
    AuthFeatureModule,
    UsersModule,
    CompaniesModule,
    CouriersModule,
    JobsModule,
    PaymentsModule,
    AdminModule,
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
