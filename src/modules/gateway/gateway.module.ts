import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { FlowGateway } from './flow.gateway';

@Module({
  providers: [GatewayService, FlowGateway],
  exports: [GatewayService]
})
export class GatewayModule { }
