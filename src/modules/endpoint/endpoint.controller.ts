import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { EndpointService } from './endpoint.service';

@Controller('endpoints')
export class EndpointController {
    constructor(private readonly endpointService: EndpointService) { }

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
