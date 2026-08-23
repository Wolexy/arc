import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || 'unknown';
    // use this when using proxy server like nginx /cloud
    //const ip = req.headers['x-forwarded-for'] || req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.auth.login(dto.email, dto.password, ip, userAgent);
  }

  /* ---------------------------
     EMAIL VERIFICATION
  ----------------------------*/
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }
}
