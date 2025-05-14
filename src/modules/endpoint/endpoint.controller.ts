import { Controller, HttpCode, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UploadEndpointsDTO } from './dto/upload-endpoints.dto';
import { FileValidationPipe } from './pipe';

@Controller('/projects/:projectId/endpoints')
@ApiBearerAuth()
@ApiParam({ name: 'projectId', required: true, type: String })
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) { }

  @ApiOperation({ summary: 'Get all endpoints' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAll(
    @Param('projectId') projectId: string,
    @Query('page') page: number,
    @Query('limit') limit: number
  ) {
    return await this.endpointService.getAll(projectId, page, limit);
  }

  async getById() {
  }

  @ApiOperation({ summary: 'Upload api endpoints\' file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'File to upload', type: UploadEndpointsDTO })
  @HttpCode(200)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File) {
    return await this.endpointService.upload(file);
  }
}
