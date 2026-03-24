import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  TOKENS,
  DomainEventPublisherPort,
  MessageRepositoryPort,
  TicketRepositoryPort,
} from "../../ports/ports";
import { DOMAIN_EVENTS } from "../../../domain/events/domain-events.constants";

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort,
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(TOKENS.DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(input: { ticketId: string; authorId: string; content: string }) {
    const ticket = await this.ticketRepository.findById(input.ticketId);
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const message = await this.messageRepository.create(input);
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      type: DOMAIN_EVENTS.TICKET_MESSAGE,
      occurredAt: new Date().toISOString(),
      actorUserId: input.authorId,
      ticketId: input.ticketId,
      data: { message },
    });
    return message;
  }
}

@Injectable()
export class ListTicketMessagesUseCase {
  constructor(@Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort) {}

  execute(ticketId: string) {
    return this.messageRepository.listByTicket(ticketId);
  }
}
