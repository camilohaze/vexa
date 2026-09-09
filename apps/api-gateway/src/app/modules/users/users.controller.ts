import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@vexa/auth';
import { ApiRoutes, UserRole } from '@vexa/shared';
import { UsersService } from './users.service';

@ApiTags(ApiRoutes.USERS)
@ApiBearerAuth()
@Controller(ApiRoutes.USERS)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.users.getById(userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getById(id);
  }
}
