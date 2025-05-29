import { Module } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';
import { EndpointService } from './endpoint.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ParserModule } from '../parser/parser.module';
import { RunnerModule } from '../runner/runner.module';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService],
  imports: [DrizzleModule, ParserModule, RunnerModule],
})
export class EndpointModule { }
