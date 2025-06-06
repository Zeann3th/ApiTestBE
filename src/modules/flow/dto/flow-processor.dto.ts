import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";
import { Processor } from "src/common/types";

export class FlowProcessorDto {
    @ApiProperty({ type: "integer", description: "Flow Id", example: "1" })
    @IsInt()
    @IsNotEmpty()
    sequence: number;

    @ApiProperty({
        example: {
            "extract": {
                "access_token": "accessToken",
            }
        }
    })
    @IsNotEmpty()
    @Type(() => Processor)
    processor: Processor;
}