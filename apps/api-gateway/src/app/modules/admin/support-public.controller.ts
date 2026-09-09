import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportPublicController {
  constructor(private readonly admin: AdminService) {}

  @Get('faq')
  faq() {
    return this.admin.faq();
  }

  @Get('help')
  help() {
    return this.admin.helpCenter();
  }

  @Get('legal')
  legal() {
    return this.admin.legal();
  }
}
