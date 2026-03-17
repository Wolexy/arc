import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TestSession } from './entities/test-session.entity';
import { User } from '../users/entities/user.entity';
import { PersonalitySession } from '../personality/entities/personality-session.entity';
import { EnergyResultEligibleCenter } from 'src/energy/entities/energy-result-eligible.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(TestSession)
    private readonly sessionRepo: Repository<TestSession>,
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(EnergyResultEligibleCenter)
    private energyEligibleRepo: Repository<EnergyResultEligibleCenter>,

    @InjectRepository(PersonalitySession)
    private personalitySessionRepo: Repository<PersonalitySession>,
  ) {}

  async startUserSession(userId: number): Promise<TestSession> {
    /* ------------------------------------------------
  1️⃣ Check if user already has an unfinished session
  -------------------------------------------------- */
    const existing = await this.sessionRepo.findOne({
      where: {
        userId: userId,
        completedAt: IsNull(),
      },
      order: {
        startedAt: 'DESC',
      },
    });

    if (existing) {
      return existing;
    }

    /* ------------------------------------------------
  2️⃣ Otherwise create new session
  -------------------------------------------------- */
    const session = this.sessionRepo.create({
      userId: userId,
      startedAt: new Date(),
    });

    return this.sessionRepo.save(session);
  }

  async getProgress(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // check eligible centers
    const eligible = await this.energyEligibleRepo.find({
      where: { sessionId },
    });

    // check personality session
    const personalitySession = await this.personalitySessionRepo.findOne({
      where: { testSessionId: sessionId },
    });

    // check user separately
    let accessGranted = false;

    if (session.userId) {
      const user = await this.userRepo.findOne({
        where: { id: session.userId },
      });

      accessGranted = user?.accessGranted ?? false;
    }

    return {
      sessionId,
      stage1Completed: !!session.stage1CompletedAt,
      stage2Started: !!personalitySession,
      accessGranted,
      eligibleCenters: eligible.map((e) => e.energyCenter),
    };
  }
}
