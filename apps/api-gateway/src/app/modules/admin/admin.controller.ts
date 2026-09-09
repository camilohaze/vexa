import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@vexa/auth';
import { ApiRoutes, UserRole } from '@vexa/shared';
import { AdminService } from './admin.service';
import {
  BroadcastNotificationDto,
  ListDisputesQueryDto,
  ListUsersQueryDto,
  UpdateDisputeDto,
  UpdateTicketDto,
} from './dto';

@ApiTags(ApiRoutes.ADMIN)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller(ApiRoutes.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users(@Query() query: ListUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Post('users/:id/suspend')
  suspendUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.suspendUser(id);
  }

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }

  @Get('disputes')
  disputes(@Query() query: ListDisputesQueryDto) {
    return this.admin.listDisputes(query);
  }

  @Patch('disputes/:id')
  updateDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisputeDto,
    @CurrentUser('id') adminId: string
  ) {
    return this.admin.updateDispute(id, dto.status, dto.assignedTo ?? adminId);
  }

  @Get('fraud')
  fraud() {
    return this.admin.fraudFlags();
  }

  @Get('commissions')
  commissions() {
    return this.admin.commissions();
  }

  @Get('reports')
  reports() {
    return this.admin.reports();
  }

  @Get('notifications')
  adminNotifications() {
    return this.admin.adminNotifications();
  }

  @Post('reports/generate')
  generateReport(@Body() _body: unknown) {
    return this.admin.generateReport();
  }

  @Post('payments/:id/refund')
  refundPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.refundPayment(id);
  }

  @Get('support/tickets')
  tickets() {
    return this.admin.listTickets();
  }

  @Patch('support/tickets/:id')
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser('id') adminId: string
  ) {
    return this.admin.updateTicket(id, dto.status, dto.assignTo ?? adminId);
  }

  @Get('notifications/hub')
  notificationHub() {
    return this.admin.notificationHub();
  }

  @Post('notifications/broadcast')
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.admin.broadcast(dto);
  }
}
