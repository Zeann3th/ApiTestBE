import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { PostmanParser } from './postman';

@Module({
    providers: [ParserService, PostmanParser],
    exports: [ParserService],
})
export class ParserModule { }
