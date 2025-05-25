import { Module } from '@nestjs/common';
import { FlowRunController } from './flow-run.controller';
import { FlowRunService } from './flow-run.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ChartService } from './chart.service';
import { ReportService } from './report.service';

@Module({
  controllers: [FlowRunController],
  providers: [FlowRunService, ChartService, ReportService],
  imports: [DrizzleModule]
})
export class FlowRunModule { }
