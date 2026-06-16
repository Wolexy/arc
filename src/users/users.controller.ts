import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import * as authRequestInterface from 'src/auth/interface/auth-request.interface';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: authRequestInterface.AuthRequest) {
    return this.userService.getMe(req.user.userId);
  }
}
