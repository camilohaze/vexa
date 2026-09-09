import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyEntity } from './company.entity';
import { CompanySettingsEntity } from './company-settings.entity';
import { PaymentMethodEntity } from './payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity, JobEntity, PaymentEntity, PaymentMethodEntity, NotificationEntity, CompanySettingsEntity])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
