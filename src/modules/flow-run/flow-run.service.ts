import { HttpException, Inject, Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DrizzleDB } from 'src/common/types/drizzle';
import { DRIZZLE } from 'src/database/drizzle.module';
import { flowLogs, flowRuns } from 'src/database/schema';
import { ChartService } from './chart.service';
import { ReportService } from './report.service';

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
            this.db.select().from(flowRuns)
                .where(eq(flowRuns.id, id)),
            this.db.select().from(flowLogs)
                .where(eq(flowLogs.runId, id))
        ]);

        if (logs.length === 0 || !run) {
            throw new HttpException('No logs found for this flow run', 404);
        }

        let totalResponseTime = 0, errorCount = 0;
        const requestsPerSecond: Record<string, number> = {};
        const timestamps = logs.map(log => new Date(log.createdAt).getTime());
        const minTimestamp = Math.min(...timestamps);
        const maxTimestamp = Math.max(...timestamps);
        const duration = (maxTimestamp - minTimestamp) / 1000 || 1;

        for (const log of logs) {
            if (log.responseTime) {
                totalResponseTime += log.responseTime;
            }
            if (log.error) {
                errorCount++;
            }
            const timestamp = Math.floor(new Date(log.createdAt).getTime() / 1000);
            requestsPerSecond[timestamp] = (requestsPerSecond[timestamp] || 0) + 1;
        }

        const averageResponseTime = totalResponseTime / logs.length;
        const rps = logs.length / duration;
        const errorRate = (errorCount / logs.length) * 100;

        const rpsChart = await this.chartService.createLineChart(requestsPerSecond);

        const reportData = {
            ccu: run.ccu,
            threads: run.threads,
            responseTime: averageResponseTime,
            errorRate,
            imageBuffer: rpsChart,
            duration
        };

        return await this.reportService.generateReport(reportData);
    }
}
