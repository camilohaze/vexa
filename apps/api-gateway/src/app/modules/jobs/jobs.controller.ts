import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@vexa/auth';
import { ApiRoutes, JobStatus, UserRole } from '@vexa/shared';
import { CancelJobDto, CompleteJobDto, CreateJobDto, ListJobsQueryDto, PriceEstimateQueryDto, RateJobDto, SendMessageDto } from './dto';
import { JobsService } from './jobs.service';

@ApiTags(ApiRoutes.JOBS)
@ApiBearerAuth()
@Controller(ApiRoutes.JOBS)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  create(@Body() dto: CreateJobDto, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.create(dto, user);
  }

  @Get()
  list(@Query() query: ListJobsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.list(query, user);
  }

  @Get('price-estimate')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  priceEstimate(@Query() query: PriceEstimateQueryDto) {
    return this.jobs.priceEstimate(query);
  }

  @Get(':id/receipt')
  receipt(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.receipt(id, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.getById(id, user);
  }

  @Post(':id/accept')
  @Roles(UserRole.COURIER)
  accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.accept(id, user);
  }

  @Patch(':id/pickup')
  @Roles(UserRole.COURIER)
  pickup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.advance(id, JobStatus.PICKED_UP, user);
  }

  @Patch(':id/in-transit')
  @Roles(UserRole.COURIER)
  inTransit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.advance(id, JobStatus.IN_TRANSIT, user);
  }

  @Post(':id/complete')
  @Roles(UserRole.COURIER)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteJobDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.jobs.complete(id, dto, user);
  }

  @Post(':id/rate')
  @Roles(UserRole.COMPANY)
  rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateJobDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.jobs.rate(id, dto, user);
  }

  @Get(':id/messages')
  listMessages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobs.listMessages(id, user);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.jobs.sendMessage(id, dto, user);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelJobDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.jobs.cancel(id, dto, user);
  }
}
