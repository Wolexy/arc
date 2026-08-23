import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';

import { AdminService } from './admin.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RoleGuard } from '../common/guards/role.guard';

import { Roles } from '../common/decorators/roles.decorator';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.listUsers();
  }

  @Post('grant/:userId')
  grantAccess(@Param('userId') userId: string, @Req() req : AuthRequest) {
    return this.adminService.grantAccess(Number(userId), req.user.userId);
  }

  @Post('revoke/:userId')
  revokeAccess(@Param('userId') userId: string) {
    return this.adminService.revokeAccess(Number(userId));
  }
}
