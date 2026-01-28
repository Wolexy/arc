import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TestSession } from '../sessions/test-session.entity';
import { AssessmentStage } from '../assessments/assessment-stage.entity';

import { PersonalitySession } from './entities/personality-session.entity';
import { PersonalityQuestion } from './entities/personality-question.entity';
import { PersonalityAnswerOption } from './entities/personality-answer-option.entity';
import { PersonalityResponse } from './entities/personality-response.entity';
import { PersonalityResultBreakdown } from './entities/personality-result-breakdown.entity';

@Injectable()
export class PersonalityService {
  constructor(
    @InjectRepository(TestSession)
    private testSessionRepo: Repository<TestSession>,

    @InjectRepository(AssessmentStage)
    private stageRepo: Repository<AssessmentStage>,

    @InjectRepository(PersonalitySession)
    private personalitySessionRepo: Repository<PersonalitySession>,

    @InjectRepository(PersonalityQuestion)
    private questionRepo: Repository<PersonalityQuestion>,

    @InjectRepository(PersonalityAnswerOption)
    private answerRepo: Repository<PersonalityAnswerOption>,

    @InjectRepository(PersonalityResponse)
    private responseRepo: Repository<PersonalityResponse>,

    @InjectRepository(PersonalityResultBreakdown)
    private breakdownRepo: Repository<PersonalityResultBreakdown>,
  ) {}

  /* -----------------------------------------
     ACCESS GATE
  ------------------------------------------*/
  async canAccessStage2(testSessionId: string) {
    const session = await this.testSessionRepo.findOne({
      where: { id: testSessionId },
    });

    if (!session?.stage1CompletedAt) {
      return { allowed: false, reason: 'STAGE1_NOT_COMPLETED' };
    }

    if (!session.stage2UnlockedAt) {
      return { allowed: false, reason: 'AUTH_REQUIRED' };
    }

    return { allowed: true };
  }

  /* -----------------------------------------
     GET OR CREATE PERSONALITY SESSION
  ------------------------------------------*/
  async getOrCreatePersonalitySession(
    testSessionId: string,
    energyCenter: 'GUT' | 'HEART' | 'HEAD',
  ) {
    let ps = await this.personalitySessionRepo.findOne({
      where: { testSessionId, energyCenter },
    });

    if (!ps) {
      ps = await this.personalitySessionRepo.save({
        testSessionId,
        energyCenter,
      });
    }

    return ps;
  }

  /* -----------------------------------------
     GET NEXT QUESTION
  ------------------------------------------*/
  async getNextQuestion(
    testSessionId: string,
    energyCenter: 'GUT' | 'HEART' | 'HEAD',
  ) {
    const ps = await this.getOrCreatePersonalitySession(
      testSessionId,
      energyCenter,
    );

    // Resolve assessment stage
    const stage = await this.stageRepo.findOne({
      where: {
        assessmentId: 1,
        personalityType: energyCenter,
      },
    });

    if (!stage) {
      throw new Error('Assessment stage not found');
    }

    const answered = await this.responseRepo.find({
      where: { personalitySessionId: ps.id },
    });

    const answeredIds = answered.map(r => r.questionId);

    const question = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.stage_id = :stageId', { stageId: stage.id })
      .andWhere(
        answeredIds.length ? 'q.id NOT IN (:...ids)' : '1=1',
        { ids: answeredIds },
      )
      .orderBy('q.question_order', 'ASC')
      .getOne();

    if (!question) {
      return null;
    }

    const options = await this.answerRepo.find({
      where: { questionId: question.id },
      order: { score: 'DESC' },
    });

    return { question, options };
  }

  /* -----------------------------------------
     SUBMIT ANSWER
  ------------------------------------------*/
  async submitAnswer(
    personalitySessionId: number,
    questionId: number,
    answerOptionId: number,
  ) {
    await this.responseRepo.save({
      personalitySessionId,
      questionId,
      answerOptionId,
    });

    const count = await this.responseRepo.count({
      where: { personalitySessionId },
    });

    if (count === 45) {
      return this.calculateResult(personalitySessionId);
    }

    return { answered: count };
  }

  /* -----------------------------------------
     CALCULATE RESULT
  ------------------------------------------*/
  async calculateResult(personalitySessionId: number) {
    const rows = await this.responseRepo
      .createQueryBuilder('r')
      .innerJoin(
        'personality_answer_options',
        'ao',
        'ao.id = r.answer_option_id',
      )
      .select([
        'ao.personality_type_id AS personalityTypeId',
        'SUM(ao.score) AS totalScore',
      ])
      .where('r.personality_session_id = :id', { id: personalitySessionId })
      .groupBy('ao.personality_type_id')
      .orderBy('totalScore', 'DESC')
      .getRawMany();

    if (!rows.length) {
      throw new Error('No responses found');
    }

    await this.breakdownRepo.save(
      rows.map(r => ({
        personalitySessionId,
        personalityTypeId: Number(r.personalitytypeid),
        score: Number(r.totalscore),
      })),
    );

    await this.personalitySessionRepo.update(personalitySessionId, {
      completedAt: new Date(),
    });

    const topScore = Number(rows[0].totalscore);
    const dominant = rows
      .filter(r => Number(r.totalscore) === topScore)
      .slice(0, 2)
      .map(r => Number(r.personalitytypeid));

    return {
      dominantPersonalityTypeIds: dominant,
      breakdown: rows.map(r => ({
        personalityTypeId: Number(r.personalitytypeid),
        score: Number(r.totalscore),
      })),
    };
  }
}
