import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PersonalityService } from './personality.service';

@Controller('personality')
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Get('access/:sessionId')
  checkAccess(@Param('sessionId') sessionId: string) {
return this.personalityService.canAccessStage2(sessionId);
  }

  // @Post('start/:sessionId')
  // start(@Param('sessionId') sessionId: string) {
  //   return this.personalityService.startPersonality(sessionId);
  // }

  @Get(':sessionId/:energyCenter/next')
  getNextQuestion(
    @Param('sessionId') sessionId: string,
    @Param('energyCenter') energyCenter: string,
  ) {
    const center = energyCenter.toUpperCase() as 'GUT' | 'HEART' | 'HEAD';
    return this.personalityService.getNextQuestion(
      sessionId,
      center,
    );
  }

@Post(':sessionId/:energyCenter/answer')
submitAnswer(
  @Param('sessionId') sessionId: string,
  @Param('energyCenter') energyCenter: string,
  @Body() body: { questionId: number; answerOptionId: number },
) {
  return this.personalityService.submitAnswer(
    sessionId,
    energyCenter.toUpperCase(),
    body.questionId,
    body.answerOptionId,
  );
}



}
