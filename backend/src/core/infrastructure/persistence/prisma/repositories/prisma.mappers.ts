import { Ticket, TicketMessage } from "@prisma/client";
import {
  InboxWhatsappRow,
  TicketEntity,
  TicketMessageEntity,
  TicketStatus,
  TicketChannel,
  MessageType,
} from "../../../../domain/entities/domain.types";

export function mapTicketEntity(t: Ticket): TicketEntity {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as TicketStatus,
    channel: t.channel as TicketChannel,
    customerId: t.customerId,
    assigneeId: t.assigneeId,
    whatsappContactId: t.whatsappContactId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function mapMessageEntity(m: TicketMessage): TicketMessageEntity {
  return {
    id: m.id,
    ticketId: m.ticketId,
    authorId: m.authorId,
    messageType: m.messageType as MessageType,
    text: m.text,
    r2ObjectKey: m.r2ObjectKey,
    mediaMimeType: m.mediaMimeType,
    fileName: m.fileName,
    whatsappMessageId: m.whatsappMessageId,
    replyToId: m.replyToId,
    readAt: m.readAt,
    waDelivery: m.waDelivery,
    createdAt: m.createdAt,
  };
}

export function mapWhatsappRow(
  ticket: TicketEntity,
  lastMessage: TicketMessageEntity | null,
  unreadCount: number,
  phoneE164: string,
  profileName: string | null,
): InboxWhatsappRow {
  return { ticket, lastMessage, unreadCount, contact: { phoneE164, profileName } };
}
