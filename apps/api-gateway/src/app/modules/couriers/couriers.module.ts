import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { BonusEntity } from './bonus.entity';
import { CourierEntity } from './courier.entity';
import { PayoutEntity } from './payout.entity';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourierEntity, JobEntity, PayoutEntity, BonusEntity])],
  controllers: [CouriersController],
  providers: [CouriersService],
  exports: [CouriersService],
})
export class CouriersModule {}
