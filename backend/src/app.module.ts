import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import configuration from "./config/configuration";
import { PrismaModule } from "./core/infrastructure/persistence/prisma/prisma.module";
import { StorageModule } from "./core/infrastructure/storage/storage.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { UsersModule } from "./modules/users/users.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { WhatsappModule } from "./modules/whatsapp/whatsapp.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Rate limiting: 100 requests por minuto por IP por defecto
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
      {
        name: "strict", // Para endpoints sensibles
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    StorageModule,
    AuthModule,
    RealtimeModule,
    TicketsModule,
    MessagesModule,
    WhatsappModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    // Aplicar rate limiting globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Filtro de excepciones global
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Response interceptor for standardized API format
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
