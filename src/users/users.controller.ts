import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
//import { UsersService } from './users.service';
import * as authRequestInterface from 'src/auth/interface/auth-request.interface';

// @Controller('users')
// export class UsersController1 {
//   constructor(private usersService: UsersService) {}

//   @UseGuards(JwtAuthGuard)
//   @Get('me')
//   async getMe(@Req() req: authRequestInterface.AuthRequest) {
//     const userId = req.user.userId;
//     return this.usersService.findById(userId);
//   }
// }

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: authRequestInterface.AuthRequest) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      accessGranted: req.user.accessGranted ?? false,
    };
  }
}
