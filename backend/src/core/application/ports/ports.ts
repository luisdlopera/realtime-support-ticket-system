import {
  TicketEntity,
  TicketMessageEntity,
  UserEntity,
  TicketStatus,
} from "../../domain/entities/domain.types";
import { DomainEvent } from "../../domain/events/domain-event.types";

export const TOKENS = {
  USER_REPOSITORY: "USER_REPOSITORY",
  TICKET_REPOSITORY: "TICKET_REPOSITORY",
  MESSAGE_REPOSITORY: "MESSAGE_REPOSITORY",
  NOTIFICATION_REPOSITORY: "NOTIFICATION_REPOSITORY",
  DOMAIN_EVENT_PUBLISHER: "DOMAIN_EVENT_PUBLISHER",
  SOCKET_BROADCAST_PORT: "SOCKET_BROADCAST_PORT",
  PASSWORD_HASHER: "PASSWORD_HASHER",
  TOKEN_SERVICE: "TOKEN_SERVICE",
} as const;

export interface UserRepositoryPort {
  create(data: { name: string; email: string; passwordHash: string; role: string }): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findAgents(): Promise<Pick<UserEntity, "id" | "name" | "email" | "role">[]>;
}

export interface TicketRepositoryPort {
  create(data: { title: string; description: string; customerId: string }): Promise<TicketEntity>;
  list(filters: { status?: TicketStatus; customerId?: string; assigneeId?: string }): Promise<TicketEntity[]>;
  findById(id: string): Promise<TicketEntity | null>;
  assign(ticketId: string, assigneeId: string): Promise<TicketEntity>;
  changeStatus(ticketId: string, status: TicketStatus): Promise<TicketEntity>;
  getMetrics(): Promise<{ open: number; inProgress: number; resolved: number; closed: number; unassigned: number }>;
}

export interface MessageRepositoryPort {
  create(data: { ticketId: string; authorId: string; content: string }): Promise<TicketMessageEntity>;
  listByTicket(ticketId: string): Promise<TicketMessageEntity[]>;
}

export interface NotificationRepositoryPort {
  create(data: { userId: string; ticketId?: string; type: string; payload?: unknown }): Promise<void>;
  listByUser(userId: string): Promise<
    {
      id: string;
      type: string;
      ticketId: string | null;
      payload: unknown;
      readAt: Date | null;
      createdAt: Date;
    }[]
  >;
  markAsRead(notificationId: string, userId: string): Promise<void>;
}

export interface DomainEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}

export interface SocketBroadcastPort {
  toTicketRoom(ticketId: string, eventName: string, payload: unknown): void;
  toAgents(eventName: string, payload: unknown): void;
}

export interface PasswordHasherPort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}

export interface TokenServicePort {
  sign(payload: { sub: string; role: string; email: string }): string;
  verify(token: string): { sub: string; role: string; email: string };
}
