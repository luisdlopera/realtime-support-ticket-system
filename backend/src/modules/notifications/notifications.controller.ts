import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import {
  ListNotificationsUseCase,
  MarkNotificationAsReadUseCase,
} from "../../core/application/use-cases/notifications/notifications.use-cases";
import { CurrentUser, AuthUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.listNotificationsUseCase.execute(user.sub);
  }

  @Patch(":id/read")
  markAsRead(@Param("id") notificationId: string, @CurrentUser() user: AuthUser) {
    return this.markNotificationAsReadUseCase.execute(notificationId, user.sub);
  }
}
