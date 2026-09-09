import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@vexa/auth';
import { ApiRoutes, UserRole } from '@vexa/shared';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreatePaymentMethodDto } from './dto/payment-method.dto';
import { UpdateCompanySettingsDto } from './dto/company-settings.dto';

@ApiTags(ApiRoutes.COMPANIES)
@ApiBearerAuth()
@Controller(ApiRoutes.COMPANIES)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.companies.findAll();
  }

  @Get('me')
  @Roles(UserRole.COMPANY)
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.getForUser(user);
  }

  @Get('me/wallet')
  @Roles(UserRole.COMPANY)
  wallet(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.wallet(user);
  }

  @Get('me/notifications')
  @Roles(UserRole.COMPANY)
  notifications(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.notifications(user);
  }

  @Get('me/payment-methods')
  @Roles(UserRole.COMPANY)
  paymentMethods(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.paymentMethods(user);
  }

  @Post('me/payment-methods')
  @Roles(UserRole.COMPANY)
  addPaymentMethod(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentMethodDto) {
    return this.companies.addPaymentMethod(user, dto);
  }

  @Patch('me/payment-methods/:id/default')
  @Roles(UserRole.COMPANY)
  setDefaultPaymentMethod(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.companies.setDefaultPaymentMethod(user, id);
  }

  @Delete('me/payment-methods/:id')
  @Roles(UserRole.COMPANY)
  removePaymentMethod(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.companies.removePaymentMethod(user, id);
  }

  @Get('me/transactions')
  @Roles(UserRole.COMPANY)
  transactions(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.transactions(user);
  }

  @Get('me/invoices')
  @Roles(UserRole.COMPANY)
  invoices(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.invoices(user);
  }

  @Get('me/settings')
  @Roles(UserRole.COMPANY)
  settings(@CurrentUser() user: AuthenticatedUser) {
    return this.companies.settings(user);
  }

  @Put('me/settings')
  @Roles(UserRole.COMPANY)
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanySettingsDto) {
    return this.companies.updateSettings(user, dto);
  }

  @Post()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  create(@Body() dto: CreateCompanyDto, @CurrentUser('id') ownerId: string) {
    return this.companies.create(dto, ownerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.getById(id);
  }
}
