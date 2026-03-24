import { Injectable } from "@nestjs/common";
import { NotificationType, TicketStatus as PrismaTicketStatus, UserRole as PrismaUserRole } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import {
  MessageRepositoryPort,
  NotificationRepositoryPort,
  TicketRepositoryPort,
  UserRepositoryPort,
} from "../../../../application/ports/ports";
import { TicketStatus, UserRole } from "../../../../domain/entities/domain.types";

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
}

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { title: string; description: string; customerId: string }) {
    return this.prisma.ticket.create({ data });
  }

  list(filters: { status?: TicketStatus; customerId?: string; assigneeId?: string }) {
    return this.prisma.ticket.findMany({
      where: {
        status: filters.status ? (filters.status as PrismaTicketStatus) : undefined,
        customerId: filters.customerId,
        assigneeId: filters.assigneeId,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.ticket.findUnique({ where: { id } });
  }

  async assign(ticketId: string, assigneeId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId, status: PrismaTicketStatus.IN_PROGRESS },
    });
  }

  changeStatus(ticketId: string, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as PrismaTicketStatus },
    });
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
}

@Injectable()
export class PrismaMessageRepository implements MessageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { ticketId: string; authorId: string; content: string }) {
    return this.prisma.ticketMessage.create({ data });
  }

  listByTicket(ticketId: string) {
    return this.prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
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
