import { Controller } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flows')
export class FlowController {
    constructor(private readonly flowService: FlowService) { }
}
