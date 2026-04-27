import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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
})
export class AppModule {}
