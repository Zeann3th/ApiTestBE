import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { escapeHtml } from "src/utils";

export class CreateFlowDto {
  @ApiProperty({ type: "string", description: "Flow name", example: "Buy a product" })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => escapeHtml(value))
  name: string;

  @ApiProperty({ type: "string", description: "Flow description", example: "User logs in, looks for a product, adds product to cart, checkouts", required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => escapeHtml(value))
  description: string;

  @ApiProperty({ type: [String], description: "Flow execution sequence", example: ["e53b6483-d61c-4518-8b58-e24a66d420a4", "e5c86c06-847f-4268-b47a-21742f1389c5"], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  sequence: Array<string>
}
