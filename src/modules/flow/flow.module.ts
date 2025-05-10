import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  controllers: [FlowController],
  providers: [FlowService],
  imports: [
    BullModule.registerQueue({
      name: 'flow'
    })
  ]
})
export class FlowModule { }
