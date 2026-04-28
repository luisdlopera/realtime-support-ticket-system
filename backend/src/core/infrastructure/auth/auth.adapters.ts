import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import {
  PasswordHasherPort,
  TokenServicePort,
  TokenPair,
  RefreshTokenRepositoryPort,
} from "../../application/ports/ports";

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  hash(plainText: string) {
    return bcrypt.hash(plainText, 12); // Incrementado a 12 rounds para mayor seguridad
  }

  compare(plainText: string, hash: string) {
    return bcrypt.compare(plainText, hash);
  }
}

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: { sub: string; role: string; email: string }) {
    return this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });
  }

  verify(token: string) {
    return this.jwtService.verify(token);
  }

  generateTokenPair(payload: { sub: string; role: string; email: string }): TokenPair {
    const now = new Date();
    const accessExpiresMs = 15 * 60 * 1000; // 15 minutos
    const refreshExpiresMs = 7 * 24 * 60 * 60 * 1000; // 7 días

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });

    const refreshToken = crypto.randomBytes(40).toString("hex");

    return {
      accessToken,
      refreshToken,
      accessTokenExpires: new Date(now.getTime() + accessExpiresMs),
      refreshTokenExpires: new Date(now.getTime() + refreshExpiresMs),
    };
  }
}

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
      },
    });
  }

  async findByToken(
    token: string
  ): Promise<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null } | null> {
    const result = await this.prisma.refreshToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
    return result;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
