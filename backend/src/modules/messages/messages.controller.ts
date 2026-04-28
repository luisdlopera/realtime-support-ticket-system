import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  CreateMessageUseCase,
  ListTicketMessagesUseCase,
  MarkTicketMessagesReadUseCase,
} from "../../core/application/use-cases/messages/messages.use-cases";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../common/decorators/current-user.decorator";
import { CreateMessageJsonDto } from "./dto/messages.dto";
import { WhatsappOutboundService } from "../whatsapp/whatsapp-outbound.service";
import { GetTicketUseCase } from "../../core/application/use-cases/tickets/tickets.use-cases";
import { R2StorageService } from "../../core/infrastructure/storage/r2.service";
import type { MessageType } from "../../core/domain/entities/domain.types";
import { Inject } from "@nestjs/common";
import { TOKENS, MessageRepositoryPort } from "../../core/application/ports/ports";

function mimeToMessageType(m: string | undefined): MessageType {
  if (!m) return "DOCUMENT";
  if (m.startsWith("image/")) return "IMAGE";
  if (m.startsWith("video/")) return "VIDEO";
  if (m.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}

@Controller("tickets/:ticketId/messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly listTicketMessagesUseCase: ListTicketMessagesUseCase,
    private readonly markReadUseCase: MarkTicketMessagesReadUseCase,
    private readonly getTicket: GetTicketUseCase,
    @Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort,
    private readonly r2: R2StorageService,
    private readonly whatsapp: WhatsappOutboundService,
  ) {}

  @Get()
  list(@Param("ticketId") ticketId: string) {
    return this.listTicketMessagesUseCase.execute(ticketId);
  }

  @Post("mark-read")
  markRead(@Param("ticketId") ticketId: string) {
    return this.markReadUseCase.execute(ticketId);
  }

  @Get(":messageId/media")
  async mediaUrl(
    @Param("ticketId") ticketId: string,
    @Param("messageId") messageId: string,
    @CurrentUser() _user: AuthUser,
  ) {
    const list = await this.messageRepository.listByTicket(ticketId);
    const msg = list.find((m) => m.id === messageId);
    if (!msg || !msg.r2ObjectKey) {
      throw new NotFoundException("message or media not found");
    }
    const url = await this.r2.getPresignedGetUrl(msg.r2ObjectKey, 3600);
    return { url, mimeType: msg.mediaMimeType, fileName: msg.fileName };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 mensajes por minuto
  async create(
    @Param("ticketId") ticketId: string,
    @Body() body: CreateMessageJsonDto,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const text = (body.text ?? body.content ?? "").trim() || null;
    const replyTo = body.replyToMessageId ?? null;

    let messageType: MessageType = (body.messageType as MessageType) || "TEXT";
    let r2ObjectKey: string | null = null;
    let mediaMime: string | null = null;
    let fileName: string | null = null;

    if (file) {
      messageType = mimeToMessageType(file.mimetype);
      const key = this.r2.buildKey(ticketId, file.originalname);
      if (!this.r2.isEnabled()) {
        throw new NotFoundException("R2 is not configured for media uploads");
      }
      await this.r2.putObject(key, file.buffer, file.mimetype);
      r2ObjectKey = key;
      mediaMime = file.mimetype;
      fileName = file.originalname;
    }

    const message = await this.createMessageUseCase.execute({
      ticketId,
      authorId: user.sub,
      messageType,
      text: text || (file ? null : messageType === "TEXT" ? "" : null),
      r2ObjectKey,
      mediaMimeType: mediaMime,
      fileName,
      replyToId: replyTo,
    });

    const ticket = await this.getTicket.execute(ticketId);
    if (ticket && (user.role === "AGENT" || user.role === "ADMIN") && ticket.channel === "WHATSAPP") {
      await this.whatsapp.sendAgentReply(ticket, message);
    }

    return message;
  }
}
