import { IsEmail, IsNotEmpty, IsString } from "class-validator";

class BaseUserVerificationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetUserPasswordDto extends BaseUserVerificationDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyUserEmailDto extends BaseUserVerificationDto {
}
