export type UserRole = "CUSTOMER" | "AGENT" | "ADMIN";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketChannel = "WEB" | "WHATSAPP";
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
export const USER_ROLES: UserRole[] = ["CUSTOMER", "AGENT", "ADMIN"];
export const TICKET_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
export const MESSAGE_TYPES: MessageType[] = ["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "AUDIO"];
export const TICKET_CHANNELS: TicketChannel[] = ["WEB", "WHATSAPP"];

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketEntity {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  channel: TicketChannel;
  customerId: string;
  assigneeId: string | null;
  whatsappContactId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessageEntity {
  id: string;
  ticketId: string;
  authorId: string;
  messageType: MessageType;
  text: string | null;
  r2ObjectKey: string | null;
  mediaMimeType: string | null;
  fileName: string | null;
  whatsappMessageId: string | null;
  replyToId: string | null;
  readAt: Date | null;
  waDelivery: string | null;
  createdAt: Date;
}

export interface WhatsappContactEntity {
  id: string;
  phoneE164: string;
  profileName: string | null;
  userId: string;
}

export interface InboxWhatsappRow {
  ticket: TicketEntity;
  lastMessage: TicketMessageEntity | null;
  unreadCount: number;
  contact: { phoneE164: string; profileName: string | null };
}
