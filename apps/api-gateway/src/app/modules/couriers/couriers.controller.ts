import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@vexa/auth';
import { ApiRoutes, UserRole } from '@vexa/shared';
import { CouriersService } from './couriers.service';
import {
  CreatePayoutDto,
  RegisterCourierDto,
  SubmitVerificationDto,
  UpdateCourierLocationDto,
  UpdateCourierStatusDto,
  UpdateFcmTokenDto,
  UpdateVehicleDetailsDto,
} from './dto';

@ApiTags(ApiRoutes.COURIERS)
@ApiBearerAuth()
@Controller(ApiRoutes.COURIERS)
export class CouriersController {
  constructor(private readonly couriers: CouriersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  findAll() {
    return this.couriers.findAll();
  }

  @Get('me')
  @Roles(UserRole.COURIER)
  me(@CurrentUser('id') userId: string) {
    return this.couriers.getByUserId(userId);
  }

  @Post('me')
  @Roles(UserRole.COURIER)
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterCourierDto) {
    return this.couriers.register(userId, dto);
  }

  @Get('me/earnings')
  @Roles(UserRole.COURIER)
  earnings(@CurrentUser('id') userId: string) {
    return this.couriers.earnings(userId);
  }

  @Get('me/transactions')
  @Roles(UserRole.COURIER)
  transactions(@CurrentUser('id') userId: string) {
    return this.couriers.transactions(userId);
  }

  @Get('me/verification')
  @Roles(UserRole.COURIER)
  verification(@CurrentUser('id') userId: string) {
    return this.couriers.verification(userId);
  }

  @Post('me/verification')
  @Roles(UserRole.COURIER)
  submitVerification(@CurrentUser('id') userId: string, @Body() dto: SubmitVerificationDto) {
    return this.couriers.submitVerification(userId, dto);
  }

  @Patch('me/vehicle')
  @Roles(UserRole.COURIER)
  updateVehicle(@CurrentUser('id') userId: string, @Body() dto: UpdateVehicleDetailsDto) {
    return this.couriers.updateVehicleDetails(userId, dto);
  }

  @Get('me/performance')
  @Roles(UserRole.COURIER)
  performance(@CurrentUser('id') userId: string) {
    return this.couriers.performance(userId);
  }

  @Get('me/payouts')
  @Roles(UserRole.COURIER)
  payouts(@CurrentUser('id') userId: string) {
    return this.couriers.listPayouts(userId);
  }

  @Get('me/payout-methods')
  @Roles(UserRole.COURIER)
  payoutMethods(@CurrentUser('id') userId: string) {
    return this.couriers.payoutMethods(userId);
  }

  @Post('me/payouts')
  @Roles(UserRole.COURIER)
  requestPayout(@CurrentUser('id') userId: string, @Body() dto: CreatePayoutDto) {
    return this.couriers.requestPayout(userId, dto);
  }

  @Patch('me/status')
  @Roles(UserRole.COURIER)
  updateStatus(@CurrentUser('id') userId: string, @Body() dto: UpdateCourierStatusDto) {
    return this.couriers.updateStatus(userId, dto.status);
  }

  @Patch('me/fcm-token')
  @Roles(UserRole.COURIER)
  updateFcmToken(@CurrentUser('id') userId: string, @Body() dto: UpdateFcmTokenDto) {
    return this.couriers.updateFcmToken(userId, dto.fcmToken);
  }

  @Post('me/location')
  @Roles(UserRole.COURIER)
  updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCourierLocationDto,
    @Query('jobId') jobId?: string
  ) {
    return this.couriers.updateLocation(userId, dto, jobId);
  }

  @Get(':id/profile')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.couriers.profile(id);
  }

  @Get('me/reviews')
  @Roles(UserRole.COURIER)
  myReviews(@CurrentUser('id') userId: string) {
    return this.couriers.myReviews(userId);
  }

  @Get('me/rewards')
  @Roles(UserRole.COURIER)
  rewards(@CurrentUser('id') userId: string) {
    return this.couriers.rewards(userId);
  }

  @Get(':id/reviews')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  reviews(@Param('id', ParseUUIDPipe) id: string) {
    return this.couriers.reviews(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.couriers.getById(id);
  }
}
