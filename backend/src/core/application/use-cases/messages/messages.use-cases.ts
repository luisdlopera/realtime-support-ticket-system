import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import DOMPurify from "isomorphic-dompurify";
import { TOKENS, DomainEventPublisherPort, MessageRepositoryPort, TicketRepositoryPort } from "../../ports/ports";
import { DOMAIN_EVENTS } from "../../../domain/events/domain-events.constants";
import type { MessageType } from "../../../domain/entities/domain.types";
import { ERROR_MESSAGES } from "../../../../common/constants/error-messages.constants";

// Configurar DOMPurify para permitir solo texto plano
const purifyConfig = {
  ALLOWED_TAGS: [], // No permitir ningún tag HTML
  ALLOWED_ATTR: [], // No permitir atributos
  KEEP_CONTENT: true, // Mantener el contenido de los tags
};

export type CreateMessageInput = {
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
};

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort,
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(TOKENS.DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(input: CreateMessageInput) {
    const ticket = await this.ticketRepository.findById(input.ticketId);
    if (!ticket) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE.TICKET_NOT_FOUND);
    }

    // Sanitizar texto para prevenir XSS
    const sanitizedText = input.text ? DOMPurify.sanitize(input.text, purifyConfig) : null;

    const message = await this.messageRepository.create({
      ticketId: input.ticketId,
      authorId: input.authorId,
      messageType: input.messageType,
      text: sanitizedText,
      r2ObjectKey: input.r2ObjectKey,
      mediaMimeType: input.mediaMimeType,
      fileName: input.fileName,
      whatsappMessageId: input.whatsappMessageId,
      replyToId: input.replyToId,
      readAt: input.readAt,
      waDelivery: input.waDelivery,
    });

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

@Injectable()
export class MarkTicketMessagesReadUseCase {
  constructor(@Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort) {}

  execute(ticketId: string) {
    return this.messageRepository.markInboundAsRead(ticketId);
  }
}
