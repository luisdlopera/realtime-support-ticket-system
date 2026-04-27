export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketChannel = "WEB" | "WHATSAPP";
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  channel?: TicketChannel;
  customerId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
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
  readAt: string | null;
  waDelivery: string | null;
  createdAt: string;
  /** @deprecated */
  content?: string;
}

export interface WhatsappInboxRow {
  ticket: Ticket;
  lastMessage: TicketMessage | null;
  unreadCount: number;
  contact: { phoneE164: string; profileName: string | null };
}

export interface DashboardMetrics {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  unassigned: number;
}
