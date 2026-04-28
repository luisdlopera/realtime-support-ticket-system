import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { Throttle } from "@nestjs/throttler";
import {
  LoginUseCase,
  RegisterUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
} from "../../core/application/use-cases/auth.use-cases";
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros por minuto
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 logins por minuto
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const result = await this.loginUseCase.execute(dto, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Cookie httpOnly para refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Cookie de sesión para que el middleware del frontend pueda detectar autenticación
    // No contiene el token, solo indica que hay una sesión activa
    res.cookie("auth_session", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Retornar solo access token y datos del usuario
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    const result = await this.refreshTokenUseCase.execute(oldRefreshToken);

    // Set nueva cookie con el nuevo refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    res.clearCookie("refreshToken");
    res.clearCookie("auth_session");
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(dto.email);
    // Siempre retornar éxito para no revelar si el email existe
    return { message: "If the email exists, a password reset link has been sent" };
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
    return { message: "Password has been reset successfully" };
  }
}
