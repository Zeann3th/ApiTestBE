import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProjectDto {
  @ApiProperty({ required: true, type: String, example: "VDT" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true, type: String, example: "VDT project" })
  @IsString()
  @IsOptional()
  description: string;
}
