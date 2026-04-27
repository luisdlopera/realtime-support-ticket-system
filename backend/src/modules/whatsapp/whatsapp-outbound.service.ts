import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TOKENS, WhatsappContactRepositoryPort } from "../../core/application/ports/ports";
import { R2StorageService } from "../../core/infrastructure/storage/r2.service";
import type { MessageType, TicketMessageEntity, TicketEntity } from "../../core/domain/entities/domain.types";

@Injectable()
export class WhatsappOutboundService {
  private readonly logger = new Logger(WhatsappOutboundService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(TOKENS.WHATSAPP_CONTACT_REPOSITORY) private readonly contacts: WhatsappContactRepositoryPort,
    private readonly r2: R2StorageService,
  ) {}

  private phoneId() {
    return this.config.get<{ phoneNumberId: string }>("whatsapp")?.phoneNumberId;
  }
  private token() {
    return this.config.get<{ accessToken: string }>("whatsapp")?.accessToken;
  }
  private graphV() {
    return this.config.get<{ graphVersion: string }>("whatsapp")?.graphVersion ?? "v21.0";
  }

  async sendAgentReply(ticket: TicketEntity, message: TicketMessageEntity) {
    if (ticket.channel !== "WHATSAPP" || !ticket.whatsappContactId) {
      return;
    }
    if (!this.phoneId() || !this.token()) {
      this.logger.warn("WhatsApp not configured: missing PHONE_NUMBER_ID or ACCESS_TOKEN");
      return;
    }
    const contact = await this.contacts.findById(ticket.whatsappContactId);
    if (!contact) {
      return;
    }
    const to = contact.phoneE164.replace(/^\+/, "");
    const v = this.graphV();
    const url = `https://graph.facebook.com/${v}/${this.phoneId()}/messages`;
    const body = this.buildPayload(to, message);
    if (!body) {
      return;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token()!}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      this.logger.warn(`WhatsApp send failed: ${t}`);
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
        this.logger.warn("Set R2_PUBLIC_BASE_URL to send media to WhatsApp");
      }
    }
    if (message.text) {
      return { messaging_product: "whatsapp", to: toDigits, type: "text", text: { body: message.text } };
    }
    return null;
  }
}
