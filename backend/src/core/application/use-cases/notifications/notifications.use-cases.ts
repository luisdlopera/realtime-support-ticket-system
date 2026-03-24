import { Inject, Injectable } from "@nestjs/common";
import { NotificationRepositoryPort, TOKENS } from "../../ports/ports";

@Injectable()
export class ListNotificationsUseCase {
  constructor(@Inject(TOKENS.NOTIFICATION_REPOSITORY) private readonly notificationRepository: NotificationRepositoryPort) {}

  execute(userId: string) {
    return this.notificationRepository.listByUser(userId);
  }
}

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(@Inject(TOKENS.NOTIFICATION_REPOSITORY) private readonly notificationRepository: NotificationRepositoryPort) {}

  execute(notificationId: string, userId: string) {
    return this.notificationRepository.markAsRead(notificationId, userId);
  }
}
