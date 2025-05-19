import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { RunnerModule } from '../runner/runner.module';

@Module({
  controllers: [FlowController],
  providers: [FlowService],
  imports: [DrizzleModule, RunnerModule]
})
export class FlowModule { }
