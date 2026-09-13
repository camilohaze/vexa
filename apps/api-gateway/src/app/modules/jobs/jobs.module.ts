import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { CouriersModule } from '../couriers/couriers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DirectionsService } from './directions.service';
import { JobEntity } from './job.entity';
import { JobMessageEntity } from './message.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PriceConfigEntity } from './price-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, JobMessageEntity, PriceConfigEntity]),
    CompaniesModule,
    CouriersModule,
    NotificationsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, DirectionsService],
  exports: [JobsService],
})
export class JobsModule {}
