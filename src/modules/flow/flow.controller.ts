import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flows')
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
