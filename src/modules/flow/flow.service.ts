import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class FlowService {
    constructor(@InjectQueue('queue') private readonly queue: Queue) { }
}
