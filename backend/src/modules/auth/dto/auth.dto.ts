import { IsEmail, IsIn, IsOptional, IsString, MinLength, MaxLength } from "class-validator";
import { UserRole, USER_ROLES } from "../../../core/domain/entities/domain.types";
import { IsStrongPassword } from "../../../common/validators/password.validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsStrongPassword({ message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" })
  password!: string;

  @IsIn(USER_ROLES)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsStrongPassword({ message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" })
  newPassword!: string;
}
