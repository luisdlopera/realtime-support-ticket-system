import { Module } from "@nestjs/common";
import {
  AssignTicketUseCase,
  ChangeTicketStatusUseCase,
  CreateTicketUseCase,
  GetDashboardMetricsUseCase,
  GetTicketUseCase,
  ListTicketsUseCase,
  ListWhatsappInboxUseCase,
} from "../../core/application/use-cases/tickets/tickets.use-cases";
import { TicketsController } from "./tickets.controller";

@Module({
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    ListTicketsUseCase,
    GetTicketUseCase,
    AssignTicketUseCase,
    ChangeTicketStatusUseCase,
    GetDashboardMetricsUseCase,
    ListWhatsappInboxUseCase,
  ],
  exports: [CreateTicketUseCase, GetTicketUseCase, ListWhatsappInboxUseCase, ListTicketsUseCase, ChangeTicketStatusUseCase],
})
export class TicketsModule {}
