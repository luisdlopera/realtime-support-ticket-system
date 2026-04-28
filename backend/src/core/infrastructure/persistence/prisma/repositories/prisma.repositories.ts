import { Injectable } from "@nestjs/common";
import {
  NotificationType,
  TicketStatus as PrismaTicketStatus,
  UserRole as PrismaUserRole,
  Prisma,
  MessageType as PrismaMessageType,
  TicketChannel as PrismaChannel,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import {
  CreateMessageData,
  CreateTicketData,
  MessageRepositoryPort,
  NotificationRepositoryPort,
  TicketRepositoryPort,
  UserRepositoryPort,
  WhatsappContactRepositoryPort,
} from "../../../../application/ports/ports";
import { TicketStatus, UserRole, MessageType, TicketChannel, InboxWhatsappRow } from "../../../../domain/entities/domain.types";
import { mapTicketEntity, mapMessageEntity, mapWhatsappRow } from "./prisma.mappers";

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; email: string; passwordHash: string; role: string }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role as PrismaUserRole,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAgents() {
    return this.prisma.user.findMany({
      where: { role: { in: [PrismaUserRole.AGENT, PrismaUserRole.ADMIN] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  }

  async updatePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }
}

@Injectable()
export class PrismaWhatsappContactRepository implements WhatsappContactRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phoneE164: string) {
    return this.prisma.whatsappContact.findUnique({ where: { phoneE164 } });
  }

  findById(id: string) {
    return this.prisma.whatsappContact.findUnique({ where: { id } });
  }

  createForUser(data: { phoneE164: string; profileName: string | null; userId: string }) {
    return this.prisma.whatsappContact.create({ data });
  }
}

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTicketData) {
    return this.prisma.ticket
      .create({
        data: {
          title: data.title,
          description: data.description,
          customerId: data.customerId,
          channel: data.channel,
          whatsappContactId: data.whatsappContactId ?? undefined,
        },
      })
      .then(mapTicketEntity);
  }

  list(filters: { status?: TicketStatus; customerId?: string; assigneeId?: string }) {
    return this.prisma.ticket
      .findMany({
        where: {
          status: filters.status ? (filters.status as PrismaTicketStatus) : undefined,
          customerId: filters.customerId,
          assigneeId: filters.assigneeId,
        },
        orderBy: { updatedAt: "desc" },
      })
      .then((rows) => rows.map(mapTicketEntity));
  }

  findById(id: string) {
    return this.prisma.ticket.findUnique({ where: { id } }).then((t) => (t ? mapTicketEntity(t) : null));
  }

  async assign(ticketId: string, assigneeId: string) {
    return mapTicketEntity(
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { assigneeId, status: PrismaTicketStatus.IN_PROGRESS },
      }),
    );
  }

  changeStatus(ticketId: string, status: TicketStatus) {
    return this.prisma.ticket
      .update({
        where: { id: ticketId },
        data: { status: status as PrismaTicketStatus },
      })
      .then(mapTicketEntity);
  }

  async getMetrics() {
    const grouped = await this.prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const unassigned = await this.prisma.ticket.count({ where: { assigneeId: null } });
    const metrics = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      unassigned,
    };
    for (const row of grouped) {
      if (row.status === PrismaTicketStatus.OPEN) metrics.open = row._count._all;
      if (row.status === PrismaTicketStatus.IN_PROGRESS) metrics.inProgress = row._count._all;
      if (row.status === PrismaTicketStatus.RESOLVED) metrics.resolved = row._count._all;
      if (row.status === PrismaTicketStatus.CLOSED) metrics.closed = row._count._all;
    }
    return metrics;
  }

  async findOpenWhatsappByContact(whatsappContactId: string) {
    const t = await this.prisma.ticket.findFirst({
      where: {
        channel: PrismaChannel.WHATSAPP,
        whatsappContactId,
        status: { in: [PrismaTicketStatus.OPEN, PrismaTicketStatus.IN_PROGRESS] },
      },
      orderBy: { updatedAt: "desc" },
    });
    return t ? mapTicketEntity(t) : null;
  }

  async listWhatsappInbox(params: { from?: Date; to?: Date; status?: TicketStatus; search?: string }): Promise<InboxWhatsappRow[]> {
    const and: Prisma.TicketWhereInput[] = [
      { channel: PrismaChannel.WHATSAPP },
      { whatsappContactId: { not: null } },
    ];

    if (params.from) {
      and.push({ updatedAt: { gte: params.from } });
    }
    if (params.to) {
      and.push({ updatedAt: { lte: params.to } });
    }
    if (params.status) {
      and.push({ status: params.status as PrismaTicketStatus });
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      and.push({
        OR: [
          { title: { contains: s, mode: "insensitive" } },
          { description: { contains: s, mode: "insensitive" } },
          { whatsappContact: { is: { phoneE164: { contains: s } } } },
          { whatsappContact: { is: { profileName: { contains: s, mode: "insensitive" } } } },
        ],
      });
    }

    const tickets = await this.prisma.ticket.findMany({
      where: { AND: and },
      orderBy: { updatedAt: "desc" },
      include: { whatsappContact: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const rows: InboxWhatsappRow[] = [];
    for (const t of tickets) {
      const lastMessage = t.messages[0] ? mapMessageEntity(t.messages[0]) : null;
      const unread = await this.prisma.ticketMessage.count({
        where: { ticketId: t.id, authorId: t.customerId, readAt: null },
      });
      if (!t.whatsappContact) continue;
      rows.push(
        mapWhatsappRow(
          mapTicketEntity(t),
          lastMessage,
          unread,
          t.whatsappContact.phoneE164,
          t.whatsappContact.profileName,
        ),
      );
    }
    return rows;
  }
}

@Injectable()
export class PrismaMessageRepository implements MessageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMessageData) {
    return this.prisma.ticketMessage
      .create({
        data: {
          ticketId: data.ticketId,
          authorId: data.authorId,
          messageType: (data.messageType as PrismaMessageType) ?? PrismaMessageType.TEXT,
          text: data.text ?? null,
          r2ObjectKey: data.r2ObjectKey ?? null,
          mediaMimeType: data.mediaMimeType ?? null,
          fileName: data.fileName ?? null,
          whatsappMessageId: data.whatsappMessageId ?? null,
          replyToId: data.replyToId ?? null,
          readAt: data.readAt ?? null,
          waDelivery: data.waDelivery ?? null,
        },
      })
      .then(mapMessageEntity);
  }

  listByTicket(ticketId: string) {
    return this.prisma.ticketMessage
      .findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
      })
      .then((list) => list.map(mapMessageEntity));
  }

  findByWhatsappMessageId(waId: string) {
    return this.prisma.ticketMessage.findUnique({ where: { whatsappMessageId: waId } }).then((m) => (m ? mapMessageEntity(m) : null));
  }

  async markInboundAsRead(ticketId: string): Promise<number> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return 0;
    const res = await this.prisma.ticketMessage.updateMany({
      where: { ticketId, authorId: ticket.customerId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.count;
  }

  countUnreadInTicket(ticketId: string, customerUserId: string) {
    return this.prisma.ticketMessage.count({
      where: { ticketId, authorId: customerUserId, readAt: null },
    });
  }
}

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; ticketId?: string; type: string; payload?: Record<string, unknown> }) {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        ticketId: data.ticketId,
        type: data.type as NotificationType,
        payload: data.payload as never,
      },
    });
  }

  listByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }
}
