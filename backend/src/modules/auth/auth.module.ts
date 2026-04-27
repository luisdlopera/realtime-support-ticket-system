import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TOKENS } from "../../core/application/ports/ports";
import { BcryptPasswordHasher, JwtTokenService } from "../../core/infrastructure/auth/auth.adapters";
import { LoginUseCase, RegisterUseCase } from "../../core/application/use-cases/auth.use-cases";
import { AuthController } from "./auth.controller";

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "12h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    BcryptPasswordHasher,
    JwtTokenService,
    { provide: TOKENS.PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    { provide: TOKENS.TOKEN_SERVICE, useExisting: JwtTokenService },
  ],
  exports: [TOKENS.PASSWORD_HASHER, TOKENS.TOKEN_SERVICE, JwtModule],
})
export class AuthModule {}
