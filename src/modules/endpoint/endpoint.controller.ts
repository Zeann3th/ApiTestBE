import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UploadEndpointsDTO } from './dto/upload-endpoints.dto';
import { FileValidationPipe } from '../../common/pipes';

@Controller('endpoints')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) { }

  @ApiOperation({ summary: 'Get all endpoints' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number
  ) {
    return await this.endpointService.getAll(page, limit);
  }

  @ApiOperation({ summary: 'Get endpoint by name' })
  @ApiQuery({ name: 'name', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('search')
  async search(
    @Query('name') name: string,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number
  ) {
    return await this.endpointService.search(name, page, limit);
  }

  @ApiOperation({ summary: 'Get endpoint by id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Get(':id')
  async getById(
    @Param('id') id: string
  ) {
    return await this.endpointService.getById(id);
  }

  @ApiOperation({ summary: 'Upload api endpoints\' file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'File and project name', type: UploadEndpointsDTO })
  @HttpCode(200)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File, @Body('projectName') projectName: string) {
    return await this.endpointService.upload(file, projectName);
  }

  @ApiOperation({ summary: 'Delete endpoint by id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.endpointService.delete(id);
  }

  @ApiOperation({ summary: 'Delete all endpoints' })
  @HttpCode(204)
  @Delete()
  async deleteAll() {
    return await this.endpointService.deleteAll();
  }

  @ApiOperation({ summary: 'Run endpoint by id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({ description: 'Data to run the endpoint', type: Object })
  @HttpCode(200)
  @Post(':id/run')
  async run(
    @Param('id') id: string,
    @Body() data: Record<string, any>
  ) {
    return await this.endpointService.run(id, data);
  }
}
