import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Not, IsNull } from 'typeorm';
import { TestSession } from '../sessions/entities/test-session.entity';
//import { AssessmentStage } from './entities/assessment-stage.entity';
import { PersonalitySession } from './entities/personality-session.entity';
import { PersonalityQuestion } from './entities/personality-question.entity';
import { PersonalityResponse } from './entities/personality-response.entity';
import { PersonalityResultBreakdown } from './entities/personality-result-breakdown.entity';
import { PersonalityRankChoice } from './entities/personality-rank-choice.entity';
import { PersonalityAnswerOption } from './entities/personality-answer-option.entity';
import { FinalPersonalityResult } from './entities/final-personality-result.entity';

@Injectable()
export class PersonalityService {
  constructor(
    @InjectRepository(TestSession)
    private testSessionRepo: Repository<TestSession>,

    @InjectRepository(PersonalitySession)
    private personalitySessionRepo: Repository<PersonalitySession>,

    @InjectRepository(PersonalityQuestion)
    private questionRepo: Repository<PersonalityQuestion>,

    @InjectRepository(PersonalityAnswerOption)
    private answerRepo: Repository<PersonalityAnswerOption>,

    @InjectRepository(PersonalityRankChoice)
    private rankRepo: Repository<PersonalityRankChoice>,

    @InjectRepository(PersonalityResponse)
    private responseRepo: Repository<PersonalityResponse>,

    @InjectRepository(PersonalityResultBreakdown)
    private breakdownRepo: Repository<PersonalityResultBreakdown>,

    @InjectRepository(FinalPersonalityResult)
    private finalResultRepo: Repository<FinalPersonalityResult>,
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

  private energyCenterToId(center: 'GUT' | 'HEART' | 'HEAD'): number {
    switch (center) {
      case 'GUT':
        return 1;
      case 'HEART':
        return 2;
      case 'HEAD':
        return 3;
    }
  }

  // async getNextQuestion(
  //   testSessionId: string,
  //   energyCenter: 'GUT' | 'HEART' | 'HEAD',
  // ) {
  //   // const ps = await this.getOrCreatePersonalitySession(
  //   //   testSessionId,
  //   //   energyCenter,
  //   // );

  //   const ps = await this.personalitySessionRepo.findOne({
  //     where: { testSessionId, energyCenter },
  //   });

  //   if (!ps) {
  //     throw new Error('Personality session not started. Call /start first.');
  //   }

  //   // Prevent asking questions after completion
  //   if (ps.completedAt) {
  //     return null;
  //   }
  //   const energyCenterId = this.energyCenterToId(energyCenter);

  //   const energyCenterMap = {
  //     GUT: 1,
  //     HEART: 2,
  //     HEAD: 3,
  //   };

  //   const stage = await this.stageRepo.findOne({
  //     where: {
  //       assessmentId: 1,
  //       energyCenterId: energyCenterMap[energyCenter],
  //     },
  //   });

  //   if (!stage) {
  //     throw new Error(`Assessment stage not found for ${energyCenter}`);
  //   }

  //   const answered = await this.responseRepo.find({
  //     where: { personalitySessionId: ps.id },
  //   });

  //   const answeredIds = answered.map((r) => r.questionId);

  //   const question = await this.questionRepo
  //     .createQueryBuilder('q')
  //     .where('q.energy_center= :center', { center: energyCenter })
  //     .andWhere(answeredIds.length ? 'q.id NOT IN (:...ids)' : '1=1', {
  //       ids: answeredIds,
  //     })
  //     .orderBy('q.question_order', 'ASC')
  //     .getOne();

  //   if (!question) {
  //     return null;
  //   }

  //   const options = await this.rankRepo.find({
  //     order: { score: 'ASC' }, // 1→5 natural flow
  //   });

  //   return { question, options };
  // }

  /***************************************************
   *
   *
   *
   * getNextQuestion
   *
   *
   ****************************************************/

  async getNextQuestion(
    testSessionId: string,
    energyCenter: 'GUT' | 'HEART' | 'HEAD',
  ) {
    const ps = await this.getOrCreatePersonalitySession(
      testSessionId,
      energyCenter,
    );

    // find answered questions
    const answered = await this.responseRepo.find({
      where: { personalitySessionId: ps.id },
    });

    const answeredIds = answered.map((r) => r.questionId);

    // fetch next question
    const question = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.energy_center = :center', { center: energyCenter })
      .andWhere(answeredIds.length ? 'q.id NOT IN (:...ids)' : '1=1', {
        ids: answeredIds,
      })
      .orderBy('q.question_order', 'ASC')
      .getOne();

    if (!question) return null;

    // fetch rank choices (Likert 1–5)
    const options = await this.answerRepo.find({
      where: { questionId: question.id },
      order: { score: 'ASC' }, // 1 → 5 natural flow
    });

    return { question, options };
  }

  /* -----------------------------------------
     SUBMIT ANSWER
  ------------------------------------------*/
  async submitAnswer(
    testSessionId: string,
    energyCenter: 'GUT' | 'HEART' | 'HEAD',
    questionId: number,
    rankChoiceId: number,
  ) {
    const ps = await this.getOrCreatePersonalitySession(
      testSessionId,
      energyCenter,
    );

    // prevent duplicate answers
    const existing = await this.responseRepo.findOne({
      where: {
        personalitySessionId: ps.id,
        questionId,
      },
    });

    if (existing) {
      throw new Error('Question already answered');
    }

    await this.responseRepo.save({
      personalitySessionId: ps.id,
      questionId,
      rankChoiceId,
    });

    const count = await this.responseRepo.count({
      where: { personalitySessionId: ps.id },
    });

    if (count === 45) {
      return this.calculateResult(ps.id);
    }

    return { answered: count };
  }
  /* -----------------------------------------
     CALCULATE RESULT
  ------------------------------------------*/
  async calculateResult(personalitySessionId: number) {
    const session = await this.personalitySessionRepo.findOne({
      where: { id: personalitySessionId },
    });

    if (!session || session.completedAt) {
      throw new Error('Personality session already completed or not found');
    }

    const rows = await this.responseRepo
      .createQueryBuilder('r')
      .innerJoin('personality_rank_choices', 'rc', 'rc.id = r.rank_choice_id')
      .innerJoin('personality_questions', 'q', 'q.id = r.question_id')
      .select([
        'q.personality_type_id AS personalitytypeid',
        'SUM(rc.score) AS totalscore',
      ])
      .where('r.personality_session_id = :id', { id: personalitySessionId })
      .groupBy('q.personality_type_id')
      .orderBy('totalscore', 'DESC')
      .getRawMany();

    if (!rows.length) {
      throw new Error('No responses found');
    }

    console.log('Scoring rows:', rows);

    // persist breakdown
    await this.breakdownRepo.save(
      rows.map((r) => ({
        personalitySessionId,
        personalityTypeId: Number(r.personalitytypeid),
        score: Number(r.totalscore),
      })),
    );

    // mark session completed
    await this.personalitySessionRepo.update(personalitySessionId, {
      completedAt: new Date(),
    });

    // find dominant (allow dual)
    const topScore = Number(rows[0].totalscore);

    const dominant = rows
      .filter((r) => Number(r.totalscore) === topScore)
      .slice(0, 2)
      .map((r) => Number(r.personalitytypeid));

    return {
      dominantPersonalityTypeIds: dominant,
      breakdown: rows.map((r) => ({
        personalityTypeId: Number(r.personalitytypeid),
        score: Number(r.totalscore),
      })),
    };
  }

  /* -----------------------------------------
   GET NEXT ENERGY CENTER (ORCHESTRATOR)
------------------------------------------*/
  async getNextEnergyCenter(testSessionId: string) {
    // 1️⃣ Read eligible centers from Stage 1
    const eligibleRows = await this.testSessionRepo.manager.query(
      `
    SELECT energy_center
    FROM energy_result_eligible_centers
    WHERE session_id = $1
  `,
      [testSessionId],
    );

    if (!eligibleRows.length) {
      throw new Error('No eligible centers found — run Stage 1 first');
    }

    const eligibleCenters: string[] = eligibleRows.map(
      (r: any) => r.energy_center,
    );

    // 2️⃣ Find personality sessions already completed
    const sessions = await this.personalitySessionRepo.find({
      where: { testSessionId },
    });

    const completedCenters = sessions
      .filter((s) => s.completedAt !== null)
      .map((s) => s.energyCenter);

    // 3️⃣ Determine next unfinished center
    const nextCenter = eligibleCenters.find(
      (c) => !completedCenters.includes(c),
    );

    // 4️⃣ If none → assessment complete
    if (!nextCenter) {
      return {
        completed: true,
        message: 'All personality assessments completed',
      };
    }

    return {
      completed: false,
      next: nextCenter,
    };
  }

  async getStatus(sessionId: string) {
    const sessions = await this.personalitySessionRepo.find({
      where: { testSessionId: sessionId },
    });

    const totalEligible = sessions.length;

    const completed = sessions.filter((s) => s.completedAt).length;

    return {
      totalEligible,
      completed,
      remaining: totalEligible - completed,
      isFullyCompleted: totalEligible > 0 && completed === totalEligible,
    };
  }

  /* -----------------------------------------
   START PERSONALITY ASSESSMENT (STRICT FLOW)
------------------------------------------*/
  async startPersonality(testSessionId: string) {
    const access = await this.canAccessStage2(testSessionId);

    if (!access.allowed) {
      throw new Error(access.reason);
    }

    // find eligible centers from stage1 result
    const eligibleCenters = await this.breakdownRepo.manager.query(
      `
    SELECT energy_center
    FROM energy_result_eligible_centers
    WHERE session_id = $1
  `,
      [testSessionId],
    );

    if (!eligibleCenters.length) {
      throw new Error('No eligible centers found');
    }

    const created: PersonalitySession[] = [];

    for (const row of eligibleCenters) {
      const center = row.energy_center;

      let existing = await this.personalitySessionRepo.findOne({
        where: { testSessionId, energyCenter: center },
      });

      if (!existing) {
        existing = await this.personalitySessionRepo.save({
          testSessionId,
          energyCenter: center,
        });
      }

      created.push(existing);
    }

    return {
      started: true,
      centers: created.map((c) => c.energyCenter),
    };
  }

  /*********************Final Aggregation Results**********************/

  async aggregateFinalPersonality(testSessionId: string) {
    // 1️⃣ get completed personality sessions
    const sessions = await this.personalitySessionRepo.find({
      where: {
        testSessionId,
        completedAt: Not(IsNull()),
      },
    });

    if (!sessions.length) {
      throw new Error('No completed personality assessments');
    }

    const sessionIds = sessions.map((s) => s.id);

    // 2️⃣ merge all breakdown scores across centers
    const rows = await this.breakdownRepo
      .createQueryBuilder('b')
      .select([
        'b.personality_type_id AS personalitytypeid',
        'SUM(b.score) AS totalscore',
      ])
      .where('b.personality_session_id IN (:...ids)', {
        ids: sessionIds,
      })
      .groupBy('b.personality_type_id')
      .orderBy('totalscore', 'DESC')
      .getRawMany();

    if (!rows.length) {
      throw new Error('No breakdown scores found');
    }

    // normalize result
    const results = rows.map((r) => ({
      personalityTypeId: Number(r.personalitytypeid),
      totalScore: Number(r.totalscore),
    }));

    // 3️⃣ determine highest score
    const topScore = Math.max(...results.map((r) => r.totalScore));

    // 4️⃣ delete old final results (if re-run)
    await this.finalResultRepo.delete({ testSessionId });

    // 5️⃣ persist ALL personality scores
    const records = results.map((r) => ({
      testSessionId,
      personalityTypeId: r.personalityTypeId,
      totalScore: r.totalScore,
      isDominant: r.totalScore === topScore,
    }));

    await this.finalResultRepo.save(records);

    return {
      dominantPersonalityTypeIds: records
        .filter((r) => r.isDominant)
        .map((r) => r.personalityTypeId),

      breakdown: records,
    };
  }
}
