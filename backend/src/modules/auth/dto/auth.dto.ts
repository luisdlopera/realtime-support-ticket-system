import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole, USER_ROLES } from "../../../core/domain/entities/domain.types";

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(USER_ROLES)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
