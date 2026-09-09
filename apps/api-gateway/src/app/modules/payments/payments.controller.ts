import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Public, Roles } from '@vexa/auth';
import { ApiRoutes, PaymentProvider, UserRole } from '@vexa/shared';
import { CreatePaymentDto } from './dto';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from '@vexa/payments';

@ApiTags(ApiRoutes.PAYMENTS)
@Controller(ApiRoutes.PAYMENTS)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly gateway: PaymentGatewayService
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.payments.findAll();
  }

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiBearerAuth()
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.create(dto, user);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  refund(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.payments.refund(id, body?.reason);
  }

  @Public()
  @Post('webhooks/:provider')
  @ApiExcludeEndpoint()
  webhook(
    @Param('provider') provider: PaymentProvider,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown
  ) {
    const event = this.gateway.parseWebhook(provider, headers, body);
    return this.payments.handleWebhook(provider, event);
  }
}
