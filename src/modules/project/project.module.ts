import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, JwtStrategy],
  imports: [
    DrizzleModule,
    PassportModule
  ]
})
export class ProjectModule { }
