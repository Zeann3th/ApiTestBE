import { Module } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';
import { EndpointService } from './endpoint.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService, JwtStrategy],
  imports: [DrizzleModule, PassportModule],
})
export class EndpointModule { }
