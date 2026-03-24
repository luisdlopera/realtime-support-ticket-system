import { Injectable } from "@nestjs/common";
import { SocketBroadcastPort } from "../../application/ports/ports";
import { TicketsGateway } from "../../../modules/realtime/tickets.gateway";

@Injectable()
export class SocketBroadcastAdapter implements SocketBroadcastPort {
  constructor(private readonly gateway: TicketsGateway) {}

  toTicketRoom(ticketId: string, eventName: string, payload: unknown): void {
    this.gateway.emitToTicketRoom(ticketId, eventName, payload);
  }

  toAgents(eventName: string, payload: unknown): void {
    this.gateway.emitToAgents(eventName, payload);
  }
}
