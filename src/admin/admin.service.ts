import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /* ---- grant free access ---- */
  async grantAccess(userId: number, adminId: number) {
    await this.userRepo.update(userId, {
      accessGranted: true,
      accessGrantedAt: new Date(),
      accessGrantedBy: adminId,
    });

    return { success: true };
  }

  /* ---- revoke access ---- */
  async revokeAccess(userId: number) {
    await this.userRepo.update(userId, {
      accessGranted: false,
    });

    return { success: true };
  }

  /* ---- list users ---- */
  async listUsers() {
    return this.userRepo.find({
      select: {
        id: true,
        email: true,
        role: true,
        accessGranted: true,
        accessGrantedAt: true,
        accessGrantedBy: true,
        createdAt: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    });
  }
}
