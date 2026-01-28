import { UsersModule } from './../users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';


import { PersonalitySession } from './entities/personality-session.entity';
import { PersonalityQuestion } from './entities/personality-question.entity';
import { PersonalityAnswerOption } from './entities/personality-answer-option.entity';
import { PersonalityResponse } from './entities/personality-response.entity';
import { PersonalityResultBreakdown } from './entities/personality-result-breakdown.entity';
import { AssessmentStage } from './entities/assessment-stage.entity';  

import { TestSession } from '../sessions/entities/test-session.entity';

// import { EnergyResultEligibleCenter } from '../energy/entities/energy-result-eligible.entity';
// import { PersonalityResult } from './entities/personality-result.entity';
// import {PersonalityResultType} from './entities/personality-result-type.entity'


@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestSession,
      PersonalityQuestion,
      PersonalityAnswerOption,
      PersonalityResponse,
     // EnergyResultEligibleCenter,
      PersonalitySession,
     // PersonalityResult,
      PersonalityResultBreakdown,
     // PersonalityResultType,
      AssessmentStage,
    ]),
    UsersModule,
  ],
  controllers: [PersonalityController],
  providers: [PersonalityService],
})
export class PersonalityModule {}
