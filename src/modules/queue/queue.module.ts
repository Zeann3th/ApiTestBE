import { Module } from '@nestjs/common';
import { Consumer } from './queue.consumer';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { DrizzleModule } from 'src/database/drizzle.module';

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
                    delay: 3000,
                },
            },
        }),
        DrizzleModule
    ],
    providers: [Consumer, QueueService],
    exports: [BullModule],
})
export class QueueModule { }
