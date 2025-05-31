import { Injectable } from '@nestjs/common';
import { FlowGateway } from './flow.gateway';

@Injectable()
export class GatewayService {
    private buffers: Record<string, any[]> = {};
    private intervals: Record<string, NodeJS.Timeout> = {};

    constructor(private readonly gateway: FlowGateway) { }

    emitLog(runId: string, log: any) {
        if (!this.buffers[runId]) {
            this.buffers[runId] = [];
            this.intervals[runId] = setInterval(() => this.flush(runId), 5000);
        }

        this.buffers[runId].push(log);

        if (this.buffers[runId].length >= 100) {
            this.flush(runId);
        }
    }

    emitDone(runId: string, message: string) {
        this.flush(runId);
        this.gateway.sendDone(runId, message);
        this.cleanup(runId);
    }

    private flush(runId: string) {
        const logs = this.buffers[runId];
        if (logs?.length) {
            this.gateway.sendLog(runId, [...logs]);
            this.buffers[runId] = [];
        }
    }

    private cleanup(runId: string) {
        delete this.buffers[runId];
        if (this.intervals[runId]) {
            clearInterval(this.intervals[runId]);
            delete this.intervals[runId];
        }
    }
}