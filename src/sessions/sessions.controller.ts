import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async start(@Req() req: AuthRequest) {
    const userId = req.user.userId;
    return this.sessionsService.startUserSession(userId);
  }

  @Get('progress/:sessionId')
  async progress(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getProgress(sessionId);
  }
}
