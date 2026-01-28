import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { EnergyService } from './energy.service';

@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get('next/:sessionId')
  async next(@Param('sessionId') sessionId: string) {
    return this.energyService.getNextGroup(sessionId);
  }

  @Post('submit')
  async submit(@Body() body: any) {
    return this.energyService.submitGroupRanking(
      body.sessionId,
      body.energyStatementGroupId,
      body.rankings,
    );
  }

  @Post('finish/:sessionId')
  async finish(@Param('sessionId') sessionId: string) {
    return this.energyService.finishStage1(sessionId);
  }
}
