import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '@vexa/notifications';
import { CompanyEntity } from '../companies/company.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { NotificationTemplateEntity } from '../notifications/notification-template.entity';
import { ScheduledNotificationEntity } from '../notifications/scheduled-notification.entity';
import { CourierEntity } from '../couriers/courier.entity';
import { JobEntity } from '../jobs/job.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { UserEntity } from '../users/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BroadcastConsumer } from './broadcast.consumer';
import { SupportPublicController } from './support-public.controller';
import { CommissionConfigEntity } from './commission-config.entity';
import { DisputeEntity } from './dispute.entity';
import { SupportArticleEntity } from './support-article.entity';
import { SupportTicketEntity } from './support-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CompanyEntity,
      CourierEntity,
      JobEntity,
      PaymentEntity,
      DisputeEntity,
      SupportTicketEntity,
      NotificationEntity,
      CommissionConfigEntity,
      NotificationTemplateEntity,
      ScheduledNotificationEntity,
      SupportArticleEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [AdminController, SupportPublicController],
  providers: [AdminService, BroadcastConsumer],
})
export class AdminModule {}
