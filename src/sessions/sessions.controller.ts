import { Controller, Post, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  async start(@Body('email') email: string) {
    const session = await this.sessionsService.startGuestSession(email);
    return {
      session_id: session.id,
      message: 'Guest session started successfully',
    };
  }
}
