import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { Express } from 'express';
import { escapeHtml } from 'src/utils';

export class UploadEndpointsDTO {
    @ApiProperty({ type: 'string', format: 'binary', description: 'Api file' })
    @IsNotEmpty()
    file: Express.Multer.File;

    @ApiProperty({ type: 'string', description: 'Project name', example: 'default' })
    @IsNotEmpty()
    @Transform(({ value }) => escapeHtml(value))
    projectName: string;
}