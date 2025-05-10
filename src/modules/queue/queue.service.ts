import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class QueueService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

    async processUpload() {
        return {
            message: "Upload successfully"
        }
    }

    async processFlow() {
        return {
            message: "Flow run successfully"
        }
    }
}
