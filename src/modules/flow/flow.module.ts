import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  controllers: [FlowController],
  providers: [FlowService],
  imports: [DrizzleModule]
})
export class FlowModule { }
