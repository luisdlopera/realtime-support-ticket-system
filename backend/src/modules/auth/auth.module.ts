import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TOKENS } from "../../core/application/ports/ports";
import {
  BcryptPasswordHasher,
  JwtTokenService,
  PrismaRefreshTokenRepository,
} from "../../core/infrastructure/auth/auth.adapters";
import {
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
} from "../../core/application/use-cases/auth.use-cases";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../core/infrastructure/persistence/prisma/prisma.service";
import { ConsoleEmailService } from "../../core/infrastructure/email/email.service";

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: configService.get<string>("JWT_ACCESS_EXPIRES_IN") || "15m" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    BcryptPasswordHasher,
    JwtTokenService,
    PrismaRefreshTokenRepository,
    PrismaService,
    ConsoleEmailService,
    { provide: TOKENS.PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    { provide: TOKENS.TOKEN_SERVICE, useExisting: JwtTokenService },
    { provide: TOKENS.REFRESH_TOKEN_REPOSITORY, useExisting: PrismaRefreshTokenRepository },
    { provide: TOKENS.EMAIL_SERVICE, useExisting: ConsoleEmailService },
  ],
  exports: [TOKENS.PASSWORD_HASHER, TOKENS.TOKEN_SERVICE, JwtModule],
})
export class AuthModule {}
