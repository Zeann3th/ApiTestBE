import { HttpException, Inject, Injectable } from '@nestjs/common';
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { DrizzleDB } from 'src/common/types/drizzle';
import { DRIZZLE } from 'src/database/drizzle.module';
import { flowLogs, flowRuns } from 'src/database/schema';
import { ChartService } from './chart.service';
import { ReportService } from './report.service';
import { ReportData } from 'src/common/types';

@Injectable()
export class FlowRunService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly chartService: ChartService,
        private readonly reportService: ReportService
    ) { }

    async getAll(page: number, limit: number) {
        const [[{ total }], flowRunList] = await Promise.all([
            this.db
                .select({ total: count() })
                .from(flowRuns),
            this.db.select().from(flowRuns)
                .limit(limit)
                .offset((page - 1) * limit)
                .orderBy(desc(flowRuns.createdAt))
        ]);
        return {
            total,
            data: flowRunList,
        }
    }

    async getById(id: string) {
        const [flowRun] = await this.db.select().from(flowRuns)
            .where(eq(flowRuns.id, id));
        if (!flowRun) {
            throw new HttpException('Flow run not found', 404);
        }
        return flowRun;
    }

    async report(id: string) {
        const [[run], logs] = await Promise.all([
            this.db.select().from(flowRuns).where(eq(flowRuns.id, id)),
            this.db.select().from(flowLogs)
                .where(eq(flowLogs.runId, id))
                .orderBy(asc(flowLogs.createdAt))
        ]);

        if (logs.length === 0 || !run) {
            throw new HttpException('No logs found for this flow run', 404);
        }

        const [response] = await this.db
            .select({
                total: sql<number>`COUNT(*)`,
                errorCount: sql<number>`
  SUM(
    CASE 
      WHEN ${flowLogs.error} = true OR ${flowLogs.statusCode} >= 400 THEN 1 
      ELSE 0 
    END
  )
`,
                average: sql<number>`AVG(${flowLogs.responseTime})`,
                min: sql<number>`MIN(${flowLogs.responseTime})`,
                max: sql<number>`MAX(${flowLogs.responseTime})`,
            })
            .from(flowLogs)
            .where(eq(flowLogs.runId, id));

        const responseTimesData = await this.db
            .select({ responseTime: flowLogs.responseTime })
            .from(flowLogs)
            .where(eq(flowLogs.runId, id))
            .orderBy(asc(flowLogs.responseTime));

        const responseTimes = responseTimesData
            .map(r => r.responseTime)
            .filter(rt => rt !== null && rt !== undefined) as number[];

        const calculatePercentile = (arr: number[], percentile: number): number => {
            if (arr.length === 0) return 0;
            const index = (percentile / 100) * (arr.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;

            if (upper >= arr.length) return arr[arr.length - 1];
            return arr[lower] * (1 - weight) + arr[upper] * weight;
        };

        const p90 = calculatePercentile(responseTimes, 90);
        const p95 = calculatePercentile(responseTimes, 95);
        const p99 = calculatePercentile(responseTimes, 99);

        const responseWithPercentiles = {
            ...response,
            p90,
            p95,
            p99
        };

        const requestsPerSecond: Record<string, number> = {};
        const responseTimesPerSecond: Record<string, number[]> = {};

        for (const log of logs) {
            const secondTimestamp = Math.floor(new Date(log.createdAt).getTime() / 1000) * 1000;
            const timeLabel = new Date(secondTimestamp).toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            requestsPerSecond[timeLabel] = (requestsPerSecond[timeLabel] || 0) + 1;
            if (!responseTimesPerSecond[timeLabel]) responseTimesPerSecond[timeLabel] = [];
            responseTimesPerSecond[timeLabel].push(log.responseTime ?? 0);
        }

        const avgResponseTimePerSecond: Record<string, number> = {};
        for (const [key, times] of Object.entries(responseTimesPerSecond)) {
            const sum = times.reduce((a, b) => a + b, 0);
            avgResponseTimePerSecond[key] = times.length > 0 ? sum / times.length : 0;
        }

        const rpsChart = await this.chartService.createRPSChart(requestsPerSecond);
        const responseTimeChart = await this.chartService.createResponseTimeChart(avgResponseTimePerSecond);

        const reportData: ReportData = {
            flowRunId: run.id,
            ccu: run.ccu,
            threads: run.threads,
            responseTime: responseWithPercentiles,
            errorRate: (responseWithPercentiles.total ?? 0) > 0 ? (responseWithPercentiles.errorCount ?? 0) / responseWithPercentiles.total * 100 : 0,
            charts: [rpsChart, responseTimeChart],
            duration: run.duration,
            rps: (responseWithPercentiles.total ?? 0) / run.duration,
        };

        return await this.reportService.generateReport(reportData);
    }
}