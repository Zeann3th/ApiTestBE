import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { RunFlowDto } from './dto/run-flow.dto';
import { FlowProcessorDto } from './dto/flow-processor.dto';
import crypto from 'crypto';

@Controller('flows')
export class FlowController {
  constructor(private readonly flowService: FlowService) { }

  @ApiOperation({ summary: 'Get All Flows' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(20)) limit: number,
  ) {
    return await this.flowService.getAll(page, limit);
  }

  @ApiOperation({ summary: 'Get Flow By Id' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.flowService.getById(id);
  }

  @ApiOperation({ summary: 'Create Flow' })
  @ApiBody({ description: "name, description, sequence of a flow", type: CreateFlowDto })
  @Post()
  async create(@Body() body: CreateFlowDto) {
    return await this.flowService.create(body);
  }

  @ApiOperation({ summary: 'Run Flow' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({ description: "Flow Run configurations", type: RunFlowDto })
  @Post(':id/run')
  @HttpCode(202)
  async run(@Param('id') id: string, @Body() body: RunFlowDto) {
    const runId = crypto.randomUUID();
    this.flowService.run(id, runId, body);
    return { id: runId, message: 'Flow is running' };
  }

  @ApiOperation({ summary: 'Update Flow' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({ description: "name, description, sequence of a flow", type: UpdateFlowDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateFlowDto) {
    return await this.flowService.update(id, body);
  }

  @ApiOperation({ summary: 'Update Flow Processor' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({ description: "processor of a flow", type: FlowProcessorDto })
  @Patch(':id/processor')
  async updateProcessor(
    @Param('id') id: string,
    @Body() body: FlowProcessorDto
  ) {
    return await this.flowService.updateProcessor(id, body);
  }

  @ApiOperation({ summary: 'Delete Flow' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return await this.flowService.delete(id);
  }
}
