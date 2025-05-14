import { HttpException, Injectable } from '@nestjs/common';
import { dereference, parse, validate } from '@readme/openapi-parser';

@Injectable()
export class EndpointService {
    constructor() { }

    async getAll(projectId: string, page: number, limit: number) {
    }

    async getById(projectId: string, id: string) {
    }

    async upload(file: Express.Multer.File) {
        try {
            const docs = file.buffer.toString();
            const api = await parse(await dereference(JSON.parse(docs)));
            // Save to db
            return api;
        } catch (error) {
            throw new HttpException("Invalid OpenAPI file", 400);
        }
    }
}
