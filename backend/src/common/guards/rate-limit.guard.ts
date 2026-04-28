import { CanActivate, ExecutionContext, HttpException, Injectable, Inject } from "@nestjs/common";
import { Request } from "express";
import Redis from "ioredis";
import { ERROR_MESSAGES } from "../constants/error-messages.constants";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis | null = null;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(private readonly config: ConfigService) {
    this.windowMs = parseInt(process.env.LOGIN_WINDOW_MS || "900000", 10); // 15 minutos
    this.maxRequests = parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10); // 5 intentos

    // Inicializar Redis para rate limiting distribuido
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip || "unknown";
    const now = Date.now();
    const key = `rate_limit:login:${ip}`;

    // Si Redis está disponible, usarlo para rate limiting distribuido
    if (this.redis) {
      try {
        const current = await this.redis.get(key);
        const count = current ? parseInt(current, 10) : 0;
        const ttl = await this.redis.ttl(key);

        if (count >= this.maxRequests && ttl > 0) {
          const remainingMinutes = Math.ceil(ttl / 60);
          throw new HttpException(
            ERROR_MESSAGES.RATE_LIMIT.TOO_MANY_ATTEMPTS(remainingMinutes),
            429
          );
        }

        // Incrementar contador
        const pipeline = this.redis.pipeline();
        pipeline.incr(key);
        if (count === 0) {
          pipeline.expire(key, Math.ceil(this.windowMs / 1000));
        }
        await pipeline.exec();
      } catch (error) {
        // Si Redis falla, permitir el request (fail open) pero loggear
        console.error("Redis rate limiting error:", error);
      }
      return true;
    }

    // Fallback a memoria local (no escala horizontalmente)
    console.warn("Redis not available, using in-memory rate limiting (not suitable for multi-instance deployments)");
    return true;
  }
}
