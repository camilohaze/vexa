import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FcmService } from './fcm.service';
import { MailerService } from './mailer.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule],
  providers: [FcmService, MailerService, NotificationsService],
  exports: [FcmService, MailerService, NotificationsService],
})
export class NotificationsModule {}
