import { Controller, DefaultValuePipe, Get, Header, Param, Query } from '@nestjs/common';
import { FlowRunService } from './flow-run.service';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('flow-runs')
export class FlowRunController {
    constructor(private readonly flowRunService: FlowRunService) { }

    @ApiOperation({ summary: 'Get all flow runs' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @Get()
    async getAll(
        @Query('page', new DefaultValuePipe(1)) page: number,
        @Query('limit', new DefaultValuePipe(10)) limit: number,
    ) {
        return await this.flowRunService.getAll(page, limit);
    }

    @ApiOperation({ summary: 'Get flow run by ID' })
    @ApiParam({ name: 'id', required: true, type: String, description: 'Flow run ID' })
    @Get(':id')
    async getById(@Param('id') id: string) {
        return await this.flowRunService.getById(id);
    }

    @ApiOperation({ summary: 'Generate report for flow run' })
    @ApiParam({ name: 'id', required: true, type: String, description: 'Flow run ID' })
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename="report.pdf"')
    @Get(':id/report')
    async report(@Param('id') id: string) {
        return await this.flowRunService.report(id);
    }
}
