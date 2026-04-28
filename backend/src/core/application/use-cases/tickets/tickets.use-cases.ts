import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { TOKENS, DomainEventPublisherPort, TicketRepositoryPort } from "../../ports/ports";
import { InboxWhatsappRow, TicketChannel, TicketStatus } from "../../../domain/entities/domain.types";
import { DOMAIN_EVENTS } from "../../../domain/events/domain-events.constants";
import { ERROR_MESSAGES } from "../../../../common/constants/error-messages.constants";

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(TOKENS.DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(input: {
    title: string;
    description: string;
    customerId: string;
    channel?: TicketChannel;
    whatsappContactId?: string | null;
  }) {
    const ticket = await this.ticketRepository.create({
      title: input.title,
      description: input.description,
      customerId: input.customerId,
      channel: input.channel ?? "WEB",
      whatsappContactId: input.whatsappContactId ?? null,
    });
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      type: DOMAIN_EVENTS.TICKET_CREATED,
      occurredAt: new Date().toISOString(),
      actorUserId: input.customerId,
      ticketId: ticket.id,
      data: { ticket },
    });
    return ticket;
  }
}

@Injectable()
export class ListTicketsUseCase {
  constructor(@Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort) {}

  execute(filters: { status?: TicketStatus; customerId?: string; assigneeId?: string }) {
    return this.ticketRepository.list(filters);
  }
}

@Injectable()
export class GetTicketUseCase {
  constructor(@Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort) {}

  async execute(ticketId: string) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE.TICKET_NOT_FOUND);
    }
    return ticket;
  }
}

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(TOKENS.DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(input: { ticketId: string; assigneeId: string; actorUserId: string }) {
    const ticket = await this.ticketRepository.assign(input.ticketId, input.assigneeId);
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      type: DOMAIN_EVENTS.TICKET_ASSIGNED,
      occurredAt: new Date().toISOString(),
      actorUserId: input.actorUserId,
      ticketId: input.ticketId,
      data: { assigneeId: input.assigneeId, ticket },
    });
    return ticket;
  }
}

@Injectable()
export class ChangeTicketStatusUseCase {
  constructor(
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(TOKENS.DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(input: { ticketId: string; status: TicketStatus; actorUserId: string }) {
    const previous = await this.ticketRepository.findById(input.ticketId);
    if (!previous) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE.TICKET_NOT_FOUND);
    }
    const ticket = await this.ticketRepository.changeStatus(input.ticketId, input.status);
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      type: DOMAIN_EVENTS.TICKET_STATUS_CHANGED,
      occurredAt: new Date().toISOString(),
      actorUserId: input.actorUserId,
      ticketId: input.ticketId,
      data: { previousStatus: previous.status, newStatus: input.status, ticket },
    });
    return ticket;
  }
}

@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(@Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort) {}

  execute() {
    return this.ticketRepository.getMetrics();
  }
}

@Injectable()
export class ListWhatsappInboxUseCase {
  constructor(@Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort) {}

  execute(filters: { from?: Date; to?: Date; status?: TicketStatus; search?: string }): Promise<InboxWhatsappRow[]> {
    return this.ticketRepository.listWhatsappInbox(filters);
  }
}
