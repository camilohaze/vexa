import { Module } from '@nestjs/common';
import { NotificationsModule } from '@vexa/notifications';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
