import { Injectable } from '@nestjs/common';
import { PostmanParser } from './postman';

@Injectable()
export class ParserService {
    constructor(private postmanParser: PostmanParser) { }

    createParser(mimeType: string) {
        switch (mimeType) {
            case 'application/json':
                return this.postmanParser;
            default:
                throw new Error(`Unsupported parser type: ${mimeType}`);
        }
    }
}
