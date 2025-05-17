import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class RunFlowDto {
    @ApiProperty({ type: "integer", description: "Concurrent Users", example: 2000 })
    @Min(1)
    @IsInt()
    @IsNotEmpty()
    ccu: number;

    @ApiProperty({ type: "integer", description: "Threads", example: 10 })
    @Min(1)
    @IsInt()
    @IsNotEmpty()
    threads: number;

    @ApiProperty({ type: "integer", description: "Duration in seconds", example: 60 })
    @Min(1)
    @IsInt()
    @IsNotEmpty()
    duration: number;
}