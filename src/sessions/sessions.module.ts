import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { TestSession } from './entities/test-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TestSession])],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
