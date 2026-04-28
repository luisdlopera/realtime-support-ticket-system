import { Controller, Get, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { PrismaService } from "./core/infrastructure/persistence/prisma/prisma.service";
import {
  createHealthResponse,
  HealthCheckResult,
  createSuccessResponse,
  createErrorResponse,
} from "./common/responses/api-response";

@Controller("health")
export class HealthController {
  private redis: Redis | null = null;
  private startTime: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.startTime = Date.now();

    // Initialize Redis connection for health check
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
      });
    }
  }

  @Get()
  async check() {
    const checks: Record<string, HealthCheckResult> = {};

    // Check Database
    checks.database = await this.checkDatabase();

    // Check Redis
    checks.redis = await this.checkRedis();

    // Calculate uptime
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Determine overall status
    const allUp = Object.values(checks).every((c) => c.status === "up");
    const anyDown = Object.values(checks).some((c) => c.status === "down");

    const status = anyDown ? "unhealthy" : allUp ? "healthy" : "degraded";

    // Add memory usage
    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: memoryUsage.heapUsed < 512 * 1024 * 1024 ? "up" : "warning",
      message: `Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    };

    checks.uptime = {
      status: "up",
      message: `${uptime}s`,
    };

    const response = createHealthResponse(status, checks);

    // If unhealthy, we should still return 200 so load balancers
    // can see the detailed health status, but include the error state
    if (status === "unhealthy") {
      return createErrorResponse("HEALTH_CHECK_FAILED", "One or more services are down", {
        services: Object.entries(checks)
          .filter(([, check]) => check.status === "down")
          .map(([name]) => name),
      });
    }

    return response;
  }

  @Get("simple")
  simple() {
    return createSuccessResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  @Get("ready")
  async ready() {
    // Readiness probe - check if app can accept traffic
    const dbCheck = await this.checkDatabase();

    if (dbCheck.status !== "up") {
      return createErrorResponse("NOT_READY", "Database not ready");
    }

    return createSuccessResponse({ ready: true });
  }

  @Get("live")
  live() {
    // Liveness probe - check if app is running
    return createSuccessResponse({ alive: true });
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Simple query to check connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "down",
        message: error instanceof Error ? error.message : "Database connection failed",
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    if (!this.redis) {
      return {
        status: "warning",
        message: "Redis not configured",
      };
    }

    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "down",
        message: error instanceof Error ? error.message : "Redis connection failed",
      };
    }
  }
}
