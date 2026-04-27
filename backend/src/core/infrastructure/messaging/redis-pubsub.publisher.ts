import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";
import { DomainEventPublisherPort, SocketBroadcastPort, TOKENS } from "../../application/ports/ports";
import { DomainEvent } from "../../domain/events/domain-event.types";

const EVENTS_CHANNEL = "events:tickets";

@Injectable()
export class RedisDomainEventPublisher implements DomainEventPublisherPort, OnModuleDestroy {
  private readonly publisher: Redis;

  constructor(private readonly configService: ConfigService) {
    this.publisher = new Redis(this.configService.getOrThrow<string>("REDIS_URL"));
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.publisher.publish(EVENTS_CHANNEL, JSON.stringify(event));
  }

  async onModuleDestroy() {
    await this.publisher.quit();
  }
}

@Injectable()
export class RedisDomainEventsSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly subscriber: Redis;

  constructor(
    private readonly configService: ConfigService,
    @Inject(TOKENS.SOCKET_BROADCAST_PORT) private readonly socketBroadcast: SocketBroadcastPort,
  ) {
    this.subscriber = new Redis(this.configService.getOrThrow<string>("REDIS_URL"));
  }

  async onModuleInit() {
    await this.subscriber.subscribe(EVENTS_CHANNEL);
    this.subscriber.on("message", (_channel, payload) => {
      const event = JSON.parse(payload) as DomainEvent;
      this.socketBroadcast.toTicketRoom(event.ticketId, event.type, event);
      if (
        event.type === "ticket.created" ||
        event.type === "ticket.assigned" ||
        event.type === "ticket.status.changed" ||
        event.type === "ticket.message"
      ) {
        this.socketBroadcast.toAgents(event.type, event);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }
}
