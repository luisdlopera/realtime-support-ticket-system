import {
  TicketEntity,
  TicketMessageEntity,
  UserEntity,
  TicketStatus,
  TicketChannel,
  MessageType,
  InboxWhatsappRow,
  WhatsappContactEntity,
} from "../../domain/entities/domain.types";
import { DomainEvent } from "../../domain/events/domain-event.types";

export const TOKENS = {
  USER_REPOSITORY: "USER_REPOSITORY",
  WHATSAPP_CONTACT_REPOSITORY: "WHATSAPP_CONTACT_REPOSITORY",
  TICKET_REPOSITORY: "TICKET_REPOSITORY",
  MESSAGE_REPOSITORY: "MESSAGE_REPOSITORY",
  NOTIFICATION_REPOSITORY: "NOTIFICATION_REPOSITORY",
  DOMAIN_EVENT_PUBLISHER: "DOMAIN_EVENT_PUBLISHER",
  SOCKET_BROADCAST_PORT: "SOCKET_BROADCAST_PORT",
  PASSWORD_HASHER: "PASSWORD_HASHER",
  TOKEN_SERVICE: "TOKEN_SERVICE",
  REFRESH_TOKEN_REPOSITORY: "REFRESH_TOKEN_REPOSITORY",
  EMAIL_SERVICE: "EMAIL_SERVICE",
  R2_STORAGE: "R2_STORAGE",
} as const;

export interface CreateMessageData {
  ticketId: string;
  authorId: string;
  messageType: MessageType;
  text?: string | null;
  r2ObjectKey?: string | null;
  mediaMimeType?: string | null;
  fileName?: string | null;
  whatsappMessageId?: string | null;
  replyToId?: string | null;
  readAt?: Date | null;
  waDelivery?: string | null;
}

export interface UserRepositoryPort {
  create(data: { name: string; email: string; passwordHash: string; role: string }): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findAgents(): Promise<Pick<UserEntity, "id" | "name" | "email" | "role">[]>;
}

export interface WhatsappContactRepositoryPort {
  findByPhone(phoneE164: string): Promise<WhatsappContactEntity | null>;
  findById(id: string): Promise<WhatsappContactEntity | null>;
  createForUser(data: { phoneE164: string; profileName: string | null; userId: string }): Promise<WhatsappContactEntity>;
}

export interface CreateTicketData {
  title: string;
  description: string;
  customerId: string;
  channel: TicketChannel;
  whatsappContactId?: string | null;
}

export interface TicketRepositoryPort {
  create(data: CreateTicketData): Promise<TicketEntity>;
  list(filters: { status?: TicketStatus; customerId?: string; assigneeId?: string }): Promise<TicketEntity[]>;
  findById(id: string): Promise<TicketEntity | null>;
  assign(ticketId: string, assigneeId: string): Promise<TicketEntity>;
  changeStatus(ticketId: string, status: TicketStatus): Promise<TicketEntity>;
  getMetrics(): Promise<{ open: number; inProgress: number; resolved: number; closed: number; unassigned: number }>;
  findOpenWhatsappByContact(whatsappContactId: string): Promise<TicketEntity | null>;
  listWhatsappInbox(params: { from?: Date; to?: Date; status?: TicketStatus; search?: string }): Promise<InboxWhatsappRow[]>;
}

export interface MessageRepositoryPort {
  create(data: CreateMessageData): Promise<TicketMessageEntity>;
  listByTicket(ticketId: string): Promise<TicketMessageEntity[]>;
  findByWhatsappMessageId(waId: string): Promise<TicketMessageEntity | null>;
  markInboundAsRead(ticketId: string): Promise<number>;
  countUnreadInTicket(ticketId: string, customerUserId: string): Promise<number>;
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

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

export interface TokenServicePort {
  sign(payload: { sub: string; role: string; email: string }): string;
  verify(token: string): { sub: string; role: string; email: string };
  generateTokenPair(payload: { sub: string; role: string; email: string }): TokenPair;
}

export interface RefreshTokenRepositoryPort {
  create(data: { token: string; userId: string; expiresAt: Date; userAgent?: string; ipAddress?: string }): Promise<void>;
  findByToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null } | null>;
  revoke(token: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface EmailServicePort {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
}

export interface R2StoragePort {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getPresignedGetUrl(key: string, expiresSeconds: number): Promise<string>;
  buildKey(ticketId: string, fileName: string): string;
}
