import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class PostProcessor {
    extract?: Record<string, string>;
    assert?: Record<string, string>;
}

export class FlowProcessorDto {
    @ApiProperty({ type: "integer", description: "Flow Id", example: "1" })
    @IsInt()
    @IsNotEmpty()
    sequence: number;

    @ApiProperty()
    @IsNotEmpty()
    @Type(() => PostProcessor)
    postProcessor: PostProcessor;
}