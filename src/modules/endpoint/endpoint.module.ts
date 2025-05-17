import { Module } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';
import { EndpointService } from './endpoint.service';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService],
  imports: [DrizzleModule],
})
export class EndpointModule { }
