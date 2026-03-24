import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateMessageUseCase, ListTicketMessagesUseCase } from "../../core/application/use-cases/messages/messages.use-cases";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../common/decorators/current-user.decorator";
import { CreateMessageDto } from "./dto/messages.dto";

@Controller("tickets/:ticketId/messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly listTicketMessagesUseCase: ListTicketMessagesUseCase,
  ) {}

  @Get()
  list(@Param("ticketId") ticketId: string) {
    return this.listTicketMessagesUseCase.execute(ticketId);
  }

  @Post()
  create(@Param("ticketId") ticketId: string, @Body() dto: CreateMessageDto, @CurrentUser() user: AuthUser) {
    return this.createMessageUseCase.execute({
      ticketId,
      content: dto.content,
      authorId: user.sub,
    });
  }
}
