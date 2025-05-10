import { Module } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';
import { EndpointService } from './endpoint.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService],
  imports: [
    BullModule.registerQueue({
      name: 'endpoint'
    })
  ],
})
export class EndpointModule { }
