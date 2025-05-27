import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EndpointModule } from './endpoint/endpoint.module';
import { FlowModule } from './flow/flow.module';
import { ParserModule } from './parser/parser.module';
import { RunnerModule } from './runner/runner.module';
import { FlowRunModule } from './flow-run/flow-run.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: minutes(15),
          limit: 500,
        }
      ]
    }),
    HealthcheckModule,
    EndpointModule,
    FlowModule,
    ParserModule,
    RunnerModule,
    FlowRunModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ]
})
export class AppModule {
}
