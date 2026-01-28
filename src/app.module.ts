import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from './sessions/sessions.module';
import { EnergyModule } from './energy/energy.module';
import { PersonalityModule } from './personality/personality.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Ay00la2012$',
      database: 'arcdb',
      autoLoadEntities: true,
      synchronize: false, // Very important to avoid data loss in production as DB is already designed.
    }),
    SessionsModule,
    EnergyModule,
    PersonalityModule,
    UsersModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
