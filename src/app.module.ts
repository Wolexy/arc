import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from './sessions/sessions.module';
import { EnergyModule } from './energy/energy.module';
import { PersonalityModule } from './personality/personality.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'arcdb',
      autoLoadEntities: true,
      synchronize: false, // Very important to avoid data loss in production as DB is already designed.
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }) as any,
    AdminModule,
    SessionsModule,
    EnergyModule,
    PersonalityModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
