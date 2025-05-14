import { IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";

class BaseUserDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterUserDto extends BaseUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class LoginUserDto extends BaseUserDto {
  @ValidateIf((o) => !o.username)
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  username: string;
}
