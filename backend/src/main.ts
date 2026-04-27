import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.get<string>("FRONTEND_URL"),
    credentials: true,
  });
  await app.listen(config.get<number>("PORT") ?? 3001);
}

void bootstrap();
