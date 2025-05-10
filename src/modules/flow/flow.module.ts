import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  controllers: [FlowController],
  providers: [FlowService],
  imports: [QueueModule],
})
export class FlowModule { }
