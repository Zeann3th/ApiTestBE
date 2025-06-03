import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from "class-validator";
import { UserCredentials } from "src/common/types";

export class RunFlowDto {
    @ApiProperty({ type: "integer", description: "Concurrent Users", example: 2000 })
    @Min(1)
    @IsInt()
    @IsNotEmpty()
    ccu: number;

    @ApiProperty({ type: "integer", description: "Threads", example: 4 })
    @Min(1)
    @Max(6)
    @IsInt()
    @IsNotEmpty()
    threads: number;

    @ApiProperty({ type: "integer", description: "Duration in seconds", example: 200 })
    @Min(30)
    @IsInt()
    @IsNotEmpty()
    duration: number;

    @ApiProperty({ type: "integer", description: "Ramp Up Time in seconds", example: 40 })
    @Min(0)
    @IsInt()
    @IsNotEmpty()
    rampUpTime: number;

    @ApiProperty({ description: "Additional input for flow", example: { "baseUrl": "http:/localhost:7554" }, required: false })
    @IsOptional()
    input: Record<string, any>;

    @ApiProperty({ description: "User credentials for authentication", required: false, example: [{ username: "Rufus", password: "Not-Rufus" }] })
    @IsOptional()
    credentials: UserCredentials[];
}