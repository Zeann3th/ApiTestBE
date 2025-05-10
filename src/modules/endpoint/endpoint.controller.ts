import { Controller, Get } from '@nestjs/common';
import { EndpointService } from './endpoint.service';

@Controller('endpoints')
export class EndpointController {
    constructor(private readonly endpointService: EndpointService) { }
}
