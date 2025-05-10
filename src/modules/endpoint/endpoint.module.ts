import { Module } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';
import { EndpointService } from './endpoint.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService],
  imports: [QueueModule],
})
export class EndpointModule { }
