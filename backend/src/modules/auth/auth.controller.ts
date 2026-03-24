import { Body, Controller, Post } from "@nestjs/common";
import { LoginUseCase, RegisterUseCase } from "../../core/application/use-cases/auth.use-cases";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly registerUseCase: RegisterUseCase, private readonly loginUseCase: LoginUseCase) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }
}
