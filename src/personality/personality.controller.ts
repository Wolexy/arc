import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PersonalityService } from './personality.service';
import { JwtAuthGuard, AccessGuard } from '../auth/jwt-auth.guard';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('personality')
@UseGuards(JwtAuthGuard, AccessGuard)
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Get('access/:sessionId')
  checkAccess(@Param('sessionId') sessionId: string) {
    return this.personalityService.canAccessStage2(sessionId);
  }

  @Post('start/:sessionId')
  start(@Param('sessionId') sessionId: string) {
    return this.personalityService.startPersonality(sessionId);
  }

  @Get(':sessionId/status')
  async status(@Param('sessionId') sessionId: string) {
    return this.personalityService.getStatus(sessionId);
  }

  @Get(':sessionId/:energyCenter/next')
  getNextQuestion(
    @Param('sessionId') sessionId: string,
    @Param('energyCenter') energyCenter: string,
  ) {
    const center = energyCenter.toUpperCase() as 'GUT' | 'HEART' | 'HEAD';

    return this.personalityService.getNextQuestion(sessionId, center);
  }

  @Post(':sessionId/:energyCenter/answer')
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Param('energyCenter') energyCenter: string,
    @Body() body: SubmitAnswerDto,
  ) {
    const center = energyCenter.toUpperCase() as 'GUT' | 'HEART' | 'HEAD';

    return this.personalityService.submitAnswer(
      sessionId,
      center,
      body.questionId,
      body.rankChoiceId,
    );
  }

  @Get('next-center/:sessionId')
  async nextCenter(@Param('sessionId') sessionId: string) {
    return this.personalityService.getNextEnergyCenter(sessionId);
  }

  @Get(':sessionId/final')
  async getFinal(@Param('sessionId') sessionId: string) {
    return this.personalityService.aggregateFinalPersonality(sessionId);
  }
}
