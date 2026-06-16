import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { UserLoginHistory } from './entities/user-login-history.entity';
import { JwtPayload } from './types/jwt-payload.type';
import { randomBytes } from 'crypto';
import { MailService } from './mail.service';
//import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserLoginHistory)
    private loginHistoryRepo: Repository<UserLoginHistory>,

    private jwtService: JwtService,

    private mailService: MailService,
  ) {}

  /* ---------------------------
     REGISTER USER
  ----------------------------*/
  async register(email: string, password: string) {
    const existing = await this.userRepo.findOne({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hash = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString('hex');

    const user = this.userRepo.create({
      email: email,
      passwordHash: hash,
      role: 'USER',
      accessGranted: false,
      createdAt: new Date(),

      emailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await this.userRepo.save(user);
    await this.mailService.sendVerification(email, token);

    return {
      message: 'User registered successfully, Please verify your email.',
    };
  }

  /* ---------------------------
     LOGIN USER
  ----------------------------*/
  async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      accessGranted: user.accessGranted,
    };

    const token: string = this.jwtService.sign(payload);

    /* update login tracking (existing logic preserved) */
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });

    /* store login history (new feature) */
    await this.loginHistoryRepo.save({
      userId: user.id,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accessGranted: user.accessGranted,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;

    await this.userRepo.save(user);

    return {
      message: 'Email verified successfully',
    };
  }
}
