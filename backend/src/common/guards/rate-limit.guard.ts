import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Request } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Usar Map en memoria (en producción usar Redis)
  private requests = new Map<string, RateLimitRecord>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip || "unknown";
    const now = Date.now();

    // Leer configuración de variables de entorno o usar defaults
    const windowMs = parseInt(process.env.LOGIN_WINDOW_MS || "900000", 10); // 15 minutos
    const maxRequests = parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10); // 5 intentos

    const record = this.requests.get(ip);

    if (!record || now > record.resetTime) {
      // Nueva ventana de tiempo
      this.requests.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      const remainingMs = record.resetTime - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      throw new HttpException(
        `Too many login attempts. Please try again in ${remainingMinutes} minute(s).`,
        429
      );
    }

    record.count++;
    return true;
  }
}
