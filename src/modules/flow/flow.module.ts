import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { QueueModule } from 'src/modules/queue/queue.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [FlowController],
  providers: [FlowService, JwtStrategy],
  imports: [QueueModule, PassportModule],
})
export class FlowModule { }
