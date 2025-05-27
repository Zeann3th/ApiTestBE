import { Controller, DefaultValuePipe, Get, Header, Param, Query, Res } from '@nestjs/common';
import { FlowRunService } from './flow-run.service';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

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
    @Get(':id/report')
    async report(@Param('id') id: string, @Res() res: Response) {
        const pdfBuffer = await this.flowRunService.report(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="report.pdf"',
            'Content-Length': pdfBuffer.length.toString(),
        });
        res.end(pdfBuffer);
    }
}
