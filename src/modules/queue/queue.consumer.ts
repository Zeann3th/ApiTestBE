import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueService } from './queue.service';

@Processor('queue')
export class Consumer extends WorkerHost {
    constructor(private readonly queueService: QueueService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'endpoint':
                await this.queueService.processUpload();
                job.log('endpoint job');
                return {};
            case 'flow':
                await this.queueService.processFlow();
                job.log('flow job');
                return {};
        }
    }

    @OnWorkerEvent("active")
    onActive(job: Job) {
        console.log(`[${job.name}] Job ${job.id} is now active`);
    }

    @OnWorkerEvent("completed")
    onCompleted(job: Job) {
        console.log(`[${job.name}] Job ${job.id} completed with result: ${job.returnvalue}`);
    }

    @OnWorkerEvent("failed")
    onError(job: Job) {
        console.log(`[${job.name}] Job ${job.id} failed with error: ${job.failedReason}`);
    }
}
