import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSession } from './entities/test-session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(TestSession)
    private readonly sessionRepo: Repository<TestSession>,
  ) {}
  async startGuestSession(email: string): Promise<TestSession> {
    const session = this.sessionRepo.create({
      guestEmail: email,
    });
    return this.sessionRepo.save(session);
  }
}
