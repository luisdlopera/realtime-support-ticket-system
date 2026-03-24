import { Module } from "@nestjs/common";
import { TOKENS } from "../../core/application/ports/ports";
import { RedisDomainEventPublisher, RedisDomainEventsSubscriber } from "../../core/infrastructure/messaging/redis-pubsub.publisher";
import { SocketBroadcastAdapter } from "../../core/infrastructure/realtime/socket-broadcast.adapter";
import { TicketsGateway } from "./tickets.gateway";

@Module({
  providers: [
    TicketsGateway,
    SocketBroadcastAdapter,
    RedisDomainEventPublisher,
    RedisDomainEventsSubscriber,
    { provide: TOKENS.SOCKET_BROADCAST_PORT, useExisting: SocketBroadcastAdapter },
    { provide: TOKENS.DOMAIN_EVENT_PUBLISHER, useExisting: RedisDomainEventPublisher },
  ],
  exports: [TOKENS.DOMAIN_EVENT_PUBLISHER],
})
export class RealtimeModule {}
