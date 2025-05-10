import env from 'src/common';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { EndpointModule } from './endpoint/endpoint.module';
import { FlowModule } from './flow/flow.module';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: minutes(15),
          limit: 500,
        }
      ]
    }),
    HealthcheckModule,
    AuthModule,
    EndpointModule,
    FlowModule,
    QueueModule,
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
