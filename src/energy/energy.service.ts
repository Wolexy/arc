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

    const answeredGroupIds = answered.map(r => r.energyStatementGroupId);

    // 2. Find next group
    const nextGroup = await this.groupRepo
      .createQueryBuilder('g')
      .where(
        'g.stage_id = :stageId',
        { stageId: 1 },
      )
      .andWhere(
        answeredGroupIds.length
          ? 'g.id NOT IN (:...ids)'
          : '1=1',
        { ids: answeredGroupIds },
      )
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
  const rankIds = rankings.map(r => r.rankId);
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
  const records = rankings.map(r => ({
    groupResponseId: groupResponse.id,
    statementId: r.statementId,
    rankId: r.rankId,
  }));

  await this.rankingRepo.save(records);

  return { success: true };
}

async finishStage1(sessionId: string) {
  // 1. Ensure all 10 groups are completed
  const completedGroups = await this.responseRepo.count({
    where: { sessionId },
  });

  if (completedGroups < 10) {
    throw new Error('Stage 1 not complete');
  }

  // 2. Aggregate scores
  const rows = await this.statementRepo
    .createQueryBuilder('s')
    .innerJoin(
      'energy_statement_rankings',
      'r',
      'r.statement_id = s.id',
    )
    .innerJoin(
      'rank_choices',
      'rc',
      'rc.id = r.rank_id',
    )
    .innerJoin(
      'energy_group_responses',
      'gr',
      'gr.id = r.group_response_id',
    )
    .where('gr.session_id = :sessionId', { sessionId })
    .select([
      's.personality_type AS personalityType',
      'SUM(rc.weight) AS score',
    ])
    .groupBy('s.personality_type')
    .getRawMany();

  // let gut = 0, heart = 0, head = 0;

  // for (const row of rows) {
  //   if (row.personalitytype === 'GUT') gut = Number(row.score);
  //   if (row.personalitytype === 'HEART') heart = Number(row.score);
  //   if (row.personalitytype === 'HEAD') head = Number(row.score);
  // }

const totals: Record<string, number> = {
  GUT: 0,
  HEART: 0,
  HEAD: 0,
};

for (const row of rows) {
  const key = row.personalitytype.toUpperCase();
  totals[key] = Number(row.score);
}

const gut = totals.GUT;
const heart = totals.HEART;
const head = totals.HEAD;


  // 3. Determine dominant center
  const scores = [
    { center: 'GUT', score: gut },
    { center: 'HEART', score: heart },
    { center: 'HEAD', score: head },
  ].sort((a, b) => b.score - a.score);

  const dominant = scores[0].center;
  const topScore = scores[0].score;

  // 4. Determine eligible centers (Option B)
  let eligibleCenters: string[];

  if (topScore >= 35) {
    eligibleCenters = [scores[0].center];
  } else if (topScore >= 30) {
    eligibleCenters = [scores[0].center, scores[1].center];
  } else {
    eligibleCenters = scores.map(s => s.center);
  }

  // 5. Persist results
  await this.energyResultRepo.save({
    sessionId,
    gutScore: gut,
    heartScore: heart,
    headScore: head,
    dominantCenter: dominant,
  });

  // 6. Persist eligible centers
  const records = eligibleCenters.map(ec => ({
    sessionId,
    energyCenter: ec,
  }));

  await this.energyEligibleRepo.save(records);

    // 7. Mark Stage 1 as completed (LIFECYCLE FLAG)
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
