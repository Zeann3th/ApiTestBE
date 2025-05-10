import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('queue')
export class Consumer extends WorkerHost {
    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'endpoint':
                job.log('endpoint job');
                return {};
            case 'flow':
                job.log('flow job');
                return {};
        }
    }
}
