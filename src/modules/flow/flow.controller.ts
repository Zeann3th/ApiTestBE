import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { FlowService } from './flow.service';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@Controller('/projects/:projectId/flows')
@ApiBearerAuth()
@ApiParam({ name: 'projectId', required: true, description: 'Project ID' })
export class FlowController {
    constructor(private readonly flowService: FlowService) { }

    @Get()
    async getAll() {

    }

    @Get(':id')
    async getById() {

    }

    @Post()
    async create() {

    }

    @Post('upload')
    async upload() {

    }

    @Patch(':id')
    async update() {

    }

    @Delete(':id')
    async delete() {

    }
}
