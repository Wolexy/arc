import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyStatementGroup } from './entities/energy-statement-group.entity';
import { EnergyStatement } from './entities/energy-statement.entity';
import { EnergyGroupResponse } from './entities/energy-group-response.entity';
import { EnergyStatementRanking } from './entities/energy-statement-ranking.entity';
import { EnergyResult } from './entities/energy-result.entity';
import { EnergyResultEligibleCenter } from './entities/energy-result-eligible.entity';
import { TestSession } from 'src/sessions/entities/test-session.entity';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(EnergyStatementGroup)
    private groupRepo: Repository<EnergyStatementGroup>,

    @InjectRepository(EnergyStatement)
    private statementRepo: Repository<EnergyStatement>,

    @InjectRepository(EnergyGroupResponse)
    private responseRepo: Repository<EnergyGroupResponse>,

    @InjectRepository(EnergyStatementRanking)
    private rankingRepo: Repository<EnergyStatementRanking>,

    @InjectRepository(EnergyResult)
    private energyResultRepo: Repository<EnergyResult>,

    @InjectRepository(EnergyResultEligibleCenter)
    private energyEligibleRepo: Repository<EnergyResultEligibleCenter>,

    @InjectRepository(TestSession)
    private sessionRepo: Repository<TestSession>,
  ) {}

  async getNextGroup(sessionId: string) {
    // 1. Find groups already answered
    const answered = await this.responseRepo.find({
      where: { sessionId },
    });

    const answeredGroupIds = answered.map((r) => r.energyStatementGroupId);

    // 2. Find next group
    const nextGroup = await this.groupRepo
      .createQueryBuilder('g')
      .where('g.stage_id = :stageId', { stageId: 1 })
      .andWhere(answeredGroupIds.length ? 'g.id NOT IN (:...ids)' : '1=1', {
        ids: answeredGroupIds,
      })
      .orderBy('g.group_no', 'ASC')
      .getOne();

    if (!nextGroup) {
      return null; // Stage 1 complete
    }

    // 3. Fetch statements
    const statements = await this.statementRepo.find({
      where: { groupId: nextGroup.id },
      order: { id: 'ASC' },
    });

    return {
      groupId: nextGroup.id,
      groupNo: nextGroup.groupNo,
      statements,
    };
  }

  async submitGroupRanking(
    sessionId: string,
    energyStatementGroupId: number,
    rankings: { statementId: number; rankId: number }[],
  ) {
    // 1. Validate exactly 3 rankings
    if (rankings.length !== 3) {
      throw new Error('Exactly 3 rankings required');
    }

    // 2. Validate unique ranks
    const rankIds = rankings.map((r) => r.rankId);
    if (new Set(rankIds).size !== 3) {
      throw new Error('Ranks must be unique');
    }

    // 3. Prevent duplicate submission
    const existing = await this.responseRepo.findOne({
      where: {
        sessionId,
        energyStatementGroupId,
      },
    });

    if (existing) {
      throw new Error('Group already submitted');
    }

    // 4. Create group response
    const groupResponse = await this.responseRepo.save({
      sessionId,
      energyStatementGroupId,
    });

    // 5. Create statement rankings
    const records = rankings.map((r) => ({
      groupResponseId: groupResponse.id,
      statementId: r.statementId,
      rankId: r.rankId,
    }));

    await this.rankingRepo.save(records);

    return { success: true };
  }

  ///////////////////////////////////////@ts-check

  async finishStage1(sessionId: string) {
    /* -----------------------------------------
     1️⃣ Ensure all 10 groups completed
  ------------------------------------------ */
    const completedGroups = await this.responseRepo.count({
      where: { sessionId },
    });

    if (completedGroups < 10) {
      throw new Error('Stage 1 not complete');
    }

    /* -----------------------------------------
     2️⃣ Aggregate scores (case-safe)
  ------------------------------------------ */
    const rows = await this.statementRepo
      .createQueryBuilder('s')
      .innerJoin('energy_statement_rankings', 'r', 'r.statement_id = s.id')
      .innerJoin('rank_choices', 'rc', 'rc.id = r.rank_id')
      .innerJoin('energy_group_responses', 'gr', 'gr.id = r.group_response_id')
      .where('gr.session_id = :sessionId', { sessionId })
      .select([
        'UPPER(s.personality_type) AS personalitytype',
        'SUM(rc.weight) AS score',
      ])
      .groupBy('UPPER(s.personality_type)')
      .getRawMany();

    const totals: Record<string, number> = {
      GUT: 0,
      HEART: 0,
      HEAD: 0,
    };

    for (const row of rows) {
      totals[row.personalitytype] = Number(row.score);
    }

    const gut = totals.GUT;
    const heart = totals.HEART;
    const head = totals.HEAD;

    /* -----------------------------------------
     3️⃣ Determine dominant (tie-safe)
  ------------------------------------------ */
    const scores = [
      { center: 'GUT', score: gut },
      { center: 'HEART', score: heart },
      { center: 'HEAD', score: head },
    ].sort((a, b) => b.score - a.score);

    const topScore = scores[0].score;

    const topCenters = scores
      .filter((s) => s.score === topScore)
      .map((s) => s.center);

    const dominant = topCenters.length === 1 ? topCenters[0] : null;

    /* -----------------------------------------
     4️⃣ Determine eligible centers (Option B)
  ------------------------------------------ */
    let eligibleCenters: string[];

    // Case 1 — Strong dominant (>=35)
    if (topScore >= 35) {
      eligibleCenters = [scores[0].center];
    }

    // Case 2 — Medium dominant (30–34)
    else if (topScore >= 30) {
      // Include ALL centers tied at top score
      eligibleCenters = scores
        .filter((s) => s.score === topScore)
        .map((s) => s.center);

      // If only one tied at top, include second highest as well
      if (eligibleCenters.length === 1) {
        eligibleCenters.push(scores[1].center);
      }
    }

    // Case 3 — Low scores (<30)
    else {
      eligibleCenters = scores.map((s) => s.center);
    }
    /* -----------------------------------------
     5️⃣ Persist energy result
  ------------------------------------------ */
    await this.energyResultRepo.save({
      sessionId: sessionId,
      gutScore: gut,
      heartScore: heart,
      headScore: head,
      dominantCenter: dominant,
    });

    /* -----------------------------------------
     6️⃣ Replace eligible centers (safe re-run)
  ------------------------------------------ */
    await this.energyEligibleRepo.delete({ sessionId });

    const records = eligibleCenters.map((ec) => ({
      sessionId,
      energyCenter: ec,
    }));

    await this.energyEligibleRepo.save(records);

    /* -----------------------------------------
     7️⃣ Mark Stage 1 completed
  ------------------------------------------ */
    await this.sessionRepo.update(sessionId, {
      stage1CompletedAt: new Date(),
    });

    return {
      gut,
      heart,
      head,
      dominant,
      eligibleCenters,
    };
  }
}
