import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Express } from 'express';

export class UploadEndpointsDTO {
    @ApiProperty({ type: 'string', format: 'binary', description: 'Api file' })
    @IsNotEmpty()
    file: Express.Multer.File;
}