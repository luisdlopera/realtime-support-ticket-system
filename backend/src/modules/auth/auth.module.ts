import { Global, Module, Provider } from "@nestjs/common";
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
import { createEmailService } from "../../core/infrastructure/email/email.service";

// Factory provider for email service
const EmailServiceProvider: Provider = {
  provide: TOKENS.EMAIL_SERVICE,
  useFactory: (config: ConfigService) => createEmailService(config),
  inject: [ConfigService],
};

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
    EmailServiceProvider,
    { provide: TOKENS.PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    { provide: TOKENS.TOKEN_SERVICE, useExisting: JwtTokenService },
    { provide: TOKENS.REFRESH_TOKEN_REPOSITORY, useExisting: PrismaRefreshTokenRepository },
  ],
  exports: [TOKENS.PASSWORD_HASHER, TOKENS.TOKEN_SERVICE, JwtModule],
})
export class AuthModule {}
