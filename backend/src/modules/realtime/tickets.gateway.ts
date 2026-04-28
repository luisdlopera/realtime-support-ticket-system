import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { TokenServicePort, TOKENS } from "../../core/application/ports/ports";
import { Inject } from "@nestjs/common";

@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
@Injectable()
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server | undefined;

  constructor(@Inject(TOKENS.TOKEN_SERVICE) private readonly tokenService: TokenServicePort) {}

  handleConnection(client: Socket) {
    try {
      const rawToken = client.handshake.auth?.token || client.handshake.headers.authorization?.replace("Bearer ", "");
      if (!rawToken) {
        client.disconnect(true);
        return;
      }
      const decoded = this.tokenService.verify(rawToken);
      client.data.user = decoded;
      if (decoded.role === "AGENT" || decoded.role === "ADMIN") {
        client.join("agents:dashboard");
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage("ticket.join")
  handleJoinTicket(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId: string }) {
    client.join(`ticket:${body.ticketId}`);
    client.emit("ticket.joined", { ticketId: body.ticketId });
  }

  @SubscribeMessage("ticket.leave")
  handleLeaveTicket(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId: string }) {
    client.leave(`ticket:${body.ticketId}`);
    client.emit("ticket.left", { ticketId: body.ticketId });
  }

  @SubscribeMessage("ticket.typing")
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId: string; isTyping: boolean }) {
    if (!this.server) {
      console.warn("[TicketsGateway] Server not initialized, cannot broadcast typing");
      return;
    }
    this.server.to(`ticket:${body.ticketId}`).emit("ticket.typing", {
      ticketId: body.ticketId,
      userId: client.data.user.sub,
      isTyping: body.isTyping,
    });
  }

  emitToTicketRoom(ticketId: string, eventName: string, payload: unknown) {
    if (!this.server) {
      console.warn("[TicketsGateway] Server not initialized, cannot emit to ticket room");
      return;
    }
    this.server.to(`ticket:${ticketId}`).emit(eventName, payload);
  }

  emitToAgents(eventName: string, payload: unknown) {
    if (!this.server) {
      console.warn("[TicketsGateway] Server not initialized, cannot emit to agents");
      return;
    }
    this.server.to("agents:dashboard").emit(eventName, payload);
  }
}
