import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /* ---------------------------
     REGISTER ENDPOINT
  ----------------------------*/
  @Post('register')
  register(
    @Body()
    body: RegisterDto,
  ) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    return this.auth.register(body.email, body.password);
  }

  /* ---------------------------
     LOGIN ENDPOINT
  ----------------------------*/
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
    @Req() req: Request,
  ) {
    const ip = req.ip || 'unknown';
    // use this when using proxy server like nginx /cloud
    //const ip = req.headers['x-forwarded-for'] || req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.auth.login(body.email, body.password, ip, userAgent);
  }

  /* ---------------------------
     EMAIL VERIFICATION
  ----------------------------*/
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }
}
