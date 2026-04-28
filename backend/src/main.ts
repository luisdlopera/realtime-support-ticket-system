import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api");

  // Security headers con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Ajustar según necesidad
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin para R2
    }),
  );

  // Cookie parser para leer cookies en requests
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = app.get(ConfigService);
  const frontendUrl = config.get<string>("FRONTEND_URL");

  // CORS con validación estricta de origen
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      // En desarrollo, permitir localhost
      if (process.env.NODE_ENV !== "production") {
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          callback(null, true);
          return;
        }
      }
      // Validar contra FRONTEND_URL
      if (origin === frontendUrl) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  await app.listen(config.get<number>("PORT") ?? 3001);
}

void bootstrap();
