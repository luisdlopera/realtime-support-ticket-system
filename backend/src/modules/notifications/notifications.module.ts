import { Module } from "@nestjs/common";
import {
  ListNotificationsUseCase,
  MarkNotificationAsReadUseCase,
} from "../../core/application/use-cases/notifications/notifications.use-cases";
import { NotificationsController } from "./notifications.controller";

@Module({
  controllers: [NotificationsController],
  providers: [ListNotificationsUseCase, MarkNotificationAsReadUseCase],
})
export class NotificationsModule {}
