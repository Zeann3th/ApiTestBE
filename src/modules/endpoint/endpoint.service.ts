import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EndpointService {
    constructor(@InjectQueue('queue') private readonly queue: Queue) { }
}
