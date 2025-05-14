import { Body, Controller, DefaultValuePipe, Get, HttpCode, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UploadEndpointsDTO } from './dto/upload-endpoints.dto';
import { FileValidationPipe } from './pipe';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('/projects/:projectId/endpoints')
@ApiBearerAuth()
@ApiParam({ name: 'projectId', required: true, type: String })
@UseGuards(JwtAuthGuard, RoleGuard)
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) { }

  @ApiOperation({ summary: 'Get all endpoints' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async getAll(
    @Param('projectId') projectId: string,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number
  ) {
    return await this.endpointService.getAll(projectId, page, limit);
  }

  @ApiOperation({ summary: 'Get endpoint by id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Get(':id')
  async getById(
    @Param('projectId') projectId: string,
    @Param('id') id: string
  ) {
    return await this.endpointService.getById(projectId, id);
  }

  @ApiOperation({ summary: 'Upload api endpoints\' file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'File to upload', type: UploadEndpointsDTO })
  @HttpCode(200)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Param('projectId') projectId: string, @UploadedFile(new FileValidationPipe()) file: Express.Multer.File) {
    return await this.endpointService.upload(projectId, file);
  }

  @ApiOperation({ summary: 'Update endpoint by id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Patch(':id')
  async update(@Param('projectId') projectId: string, @Param('id') id: string, @Body() body: any) {
    return await this.endpointService.update(projectId, id, body);

  }
}
