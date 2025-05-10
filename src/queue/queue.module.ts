import { Module } from '@nestjs/common';
import { Consumer } from './queue.consumer';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'queue',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        })
    ],
    providers: [Consumer],
    exports: [BullModule],
})
export class QueueModule { }
