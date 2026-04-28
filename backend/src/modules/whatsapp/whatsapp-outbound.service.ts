import { Inject, Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TOKENS, WhatsappContactRepositoryPort } from "../../core/application/ports/ports";
import { R2StorageService } from "../../core/infrastructure/storage/r2.service";
import type { MessageType, TicketMessageEntity, TicketEntity } from "../../core/domain/entities/domain.types";
import { ERROR_MESSAGES } from "../../common/constants/error-messages.constants";

@Injectable()
export class WhatsappOutboundService {
  private readonly logger = new Logger(WhatsappOutboundService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(TOKENS.WHATSAPP_CONTACT_REPOSITORY) private readonly contacts: WhatsappContactRepositoryPort,
    private readonly r2: R2StorageService,
  ) {}

  private phoneId(): string | null {
    return this.config.get<{ phoneNumberId: string }>("whatsapp")?.phoneNumberId ?? null;
  }
  private token(): string | null {
    return this.config.get<{ accessToken: string }>("whatsapp")?.accessToken ?? null;
  }
  private graphV(): string {
    return this.config.get<{ graphVersion: string }>("whatsapp")?.graphVersion ?? "v21.0";
  }

  async sendAgentReply(ticket: TicketEntity, message: TicketMessageEntity) {
    if (ticket.channel !== "WHATSAPP" || !ticket.whatsappContactId) {
      return;
    }

    const phoneId = this.phoneId();
    const token = this.token();

    if (!phoneId || !token) {
      this.logger.warn(ERROR_MESSAGES.WHATSAPP.NOT_CONFIGURED);
      return;
    }

    const contact = await this.contacts.findById(ticket.whatsappContactId);
    if (!contact) {
      return;
    }
    const to = contact.phoneE164.replace(/^\+/, "");
    const v = this.graphV();
    const url = `https://graph.facebook.com/${v}/${phoneId}/messages`;
    const body = this.buildPayload(to, message);
    if (!body) {
      return;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      this.logger.warn(ERROR_MESSAGES.WHATSAPP.SEND_FAILED(t));
    }
  }

  private buildPayload(
    toDigits: string,
    message: TicketMessageEntity,
  ): Record<string, unknown> | null {
    if (message.messageType === "TEXT" && !message.r2ObjectKey) {
      return {
        messaging_product: "whatsapp",
        to: toDigits,
        type: "text",
        text: { body: message.text || "" },
      };
    }
    if (message.r2ObjectKey) {
      const publicUrl = this.r2.getPublicObjectUrlIfConfigured(message.r2ObjectKey);
      if (publicUrl) {
        if (message.messageType === "IMAGE" || (message.mediaMimeType ?? "").startsWith("image/")) {
          return {
            messaging_product: "whatsapp",
            to: toDigits,
            type: "image",
            image: { link: publicUrl, caption: message.text || undefined },
          };
        }
        if (message.messageType === "VIDEO" || (message.mediaMimeType ?? "").startsWith("video/")) {
          return {
            messaging_product: "whatsapp",
            to: toDigits,
            type: "video",
            video: { link: publicUrl, caption: message.text || undefined },
          };
        }
        if (message.messageType === "AUDIO" || (message.mediaMimeType ?? "").startsWith("audio/")) {
          return { messaging_product: "whatsapp", to: toDigits, type: "audio", audio: { link: publicUrl } };
        }
        if (message.messageType === "DOCUMENT" || (message as { messageType: MessageType }).messageType === "DOCUMENT") {
          return {
            messaging_product: "whatsapp",
            to: toDigits,
            type: "document",
            document: { link: publicUrl, filename: message.fileName || "file", caption: message.text || undefined },
          };
        }
      } else {
        this.logger.warn(ERROR_MESSAGES.WHATSAPP.SET_R2_PUBLIC_URL);
      }
    }
    if (message.text) {
      return { messaging_product: "whatsapp", to: toDigits, type: "text", text: { body: message.text } };
    }
    return null;
  }
}
