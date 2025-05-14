import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
    constructor(
        private allowedMimeTypes: string[] = ["application/json", "application/xml"],
        private maxSizeInBytes: number = 20 * 1024 * 1024,
    ) { }

    transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (this.allowedMimeTypes.length && !this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
        }

        if (file.size > this.maxSizeInBytes) {
            throw new BadRequestException(`File too large. Max size is ${this.maxSizeInBytes} bytes`);
        }

        return file;
    }
}
