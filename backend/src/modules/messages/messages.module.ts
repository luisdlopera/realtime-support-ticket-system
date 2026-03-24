import { Module } from "@nestjs/common";
import { CreateMessageUseCase, ListTicketMessagesUseCase } from "../../core/application/use-cases/messages/messages.use-cases";
import { MessagesController } from "./messages.controller";

@Module({
  controllers: [MessagesController],
  providers: [CreateMessageUseCase, ListTicketMessagesUseCase],
})
export class MessagesModule {}
