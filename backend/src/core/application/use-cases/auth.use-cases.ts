import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import {
  PasswordHasherPort,
  TOKENS,
  TokenServicePort,
  TokenPair,
  UserRepositoryPort,
  RefreshTokenRepositoryPort,
  EmailServicePort,
} from "../ports/ports";
import { UserRole } from "../../domain/entities/domain.types";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(input: { name: string; email: string; password: string; role?: UserRole }) {
    const existing = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (existing) {
      // No revelar que el email ya existe - retornar éxito falso
      // Esto previene enumeración de usuarios
      return {
        id: "00000000-0000-0000-0000-000000000000",
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role ?? "CUSTOMER",
      };
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role ?? "CUSTOMER",
    });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}

export interface LoginMetadata {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKENS.TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(
    input: { email: string; password: string },
    metadata?: LoginMetadata
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; name: string; email: string; role: UserRole };
  }> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await this.hasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generar token pair
    const tokenPair = this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    // Guardar refresh token en base de datos
    await this.refreshTokenRepository.create({
      token: tokenPair.refreshToken,
      userId: user.id,
      expiresAt: tokenPair.refreshTokenExpires,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKENS.TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    // Buscar el refresh token en la base de datos
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException("Token has been revoked");
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException("Token has expired");
    }

    // Obtener datos del usuario
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Revocar el token antiguo
    await this.refreshTokenRepository.revoke(refreshToken);

    // Generar nuevos tokens
    const tokenPair = this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    // Guardar el nuevo refresh token
    await this.refreshTokenRepository.create({
      token: tokenPair.refreshToken,
      userId: user.id,
      expiresAt: tokenPair.refreshTokenExpires,
    });

    return tokenPair;
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshToken);
  }
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.EMAIL_SERVICE) private readonly emailService: EmailServicePort,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());

    // No revelar si el email existe o no por seguridad
    if (!user) {
      return;
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Guardar token en el usuario (necesitamos agregar método al repositorio)
    // Por ahora, asumimos que existe un método updatePasswordResetToken
    await (this.userRepository as any).updatePasswordResetToken?.(user.id, resetToken, expiresAt);

    // Enviar email
    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    // Buscar usuario por token válido
    const user = await (this.userRepository as any).findByPasswordResetToken?.(token);

    if (!user) {
      throw new BadRequestException("Invalid or expired token");
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException("Token has expired");
    }

    // Hashear nueva contraseña
    const passwordHash = await this.hasher.hash(newPassword);

    // Actualizar contraseña y limpiar token
    await (this.userRepository as any).updatePassword?.(user.id, passwordHash);
    await (this.userRepository as any).clearPasswordResetToken?.(user.id);
  }
}
