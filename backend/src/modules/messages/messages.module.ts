import { forwardRef, Module } from "@nestjs/common";
import { WhatsappModule } from "../whatsapp/whatsapp.module";
import { TicketsModule } from "../tickets/tickets.module";
import {
  CreateMessageUseCase,
  ListTicketMessagesUseCase,
  MarkTicketMessagesReadUseCase,
} from "../../core/application/use-cases/messages/messages.use-cases";
import { MessagesController } from "./messages.controller";

@Module({
  imports: [TicketsModule, forwardRef(() => WhatsappModule)],
  controllers: [MessagesController],
  providers: [CreateMessageUseCase, ListTicketMessagesUseCase, MarkTicketMessagesReadUseCase],
  exports: [CreateMessageUseCase, ListTicketMessagesUseCase, MarkTicketMessagesReadUseCase],
})
export class MessagesModule {}
