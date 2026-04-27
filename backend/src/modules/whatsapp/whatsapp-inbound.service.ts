import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  TOKENS,
  MessageRepositoryPort,
  PasswordHasherPort,
  TicketRepositoryPort,
  UserRepositoryPort,
  WhatsappContactRepositoryPort,
} from "../../core/application/ports/ports";
import { CreateMessageUseCase } from "../../core/application/use-cases/messages/messages.use-cases";
import { CreateTicketUseCase } from "../../core/application/use-cases/tickets/tickets.use-cases";
import { R2StorageService } from "../../core/infrastructure/storage/r2.service";
import { toE164, toInternalEmailFromPhone, phoneDigits } from "./phone.util";
import type { MessageType, TicketEntity } from "../../core/domain/entities/domain.types";

@Injectable()
export class WhatsappInboundService {
  private readonly logger = new Logger(WhatsappInboundService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOKENS.WHATSAPP_CONTACT_REPOSITORY) private readonly contacts: WhatsappContactRepositoryPort,
    @Inject(TOKENS.TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    @Inject(TOKENS.MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepositoryPort,
    private readonly r2: R2StorageService,
    private readonly createTicket: CreateTicketUseCase,
    private readonly createMessage: CreateMessageUseCase,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  private graphV() {
    return this.config.get<{ graphVersion: string }>("whatsapp")?.graphVersion ?? "v21.0";
  }

  private token() {
    return this.config.get<{ accessToken: string }>("whatsapp")?.accessToken ?? "";
  }

  async processWebhook(value: { metadata?: { phone_number_id?: string }; messages?: WAMessage[]; contacts?: WAContact[] }) {
    if (!value?.messages?.length) {
      return;
    }
    for (const msg of value.messages) {
      try {
        if (msg.type === "reaction" || (msg as { type: string }).type === "system") {
          continue;
        }
        await this.handleMessage(msg, value.contacts);
      } catch (e) {
        this.logger.error((e as Error).message, (e as Error).stack);
      }
    }
  }

  private async handleMessage(msg: WAMessage, contacts: WAContact[] | undefined) {
    if (msg.id) {
      const existing = await this.messageRepository.findByWhatsappMessageId(msg.id);
      if (existing) {
        return;
      }
    }
    const fromRaw = String(msg.from ?? "");
    const e164 = toE164(fromRaw);
    const profileName = contacts?.[0]?.profile?.name ?? null;

    const { user, contact } = await this.ensureUserAndContact(e164, profileName);
    const ticket = await this.ensureWhatsappTicket(contact.id, user.id, e164, profileName);
    const token = this.token();

    const { messageType, text, r2ObjectKey, mediaMime, fileName } = await this.buildContent(msg, token, ticket);

    await this.createMessage.execute({
      ticketId: ticket.id,
      authorId: user.id,
      messageType,
      text: text ?? (messageType === "TEXT" ? "" : null),
      r2ObjectKey: r2ObjectKey ?? null,
      mediaMimeType: mediaMime ?? null,
      fileName: fileName ?? null,
      whatsappMessageId: msg.id,
      replyToId: null,
      readAt: null,
    });
  }

  private async buildContent(msg: WAMessage, token: string, ticket: TicketEntity) {
    const t = String(msg.type ?? "text");
    if (t === "text" && msg.text) {
      return { messageType: "TEXT" as const, text: String(msg.text.body ?? ""), r2ObjectKey: null, mediaMime: null, fileName: null };
    }
    if (t === "image" && msg.image) {
      return this.putMedia(
        "IMAGE",
        msg.image.id,
        msg.image.caption,
        msg.image.mime_type ?? "image/jpeg",
        "file.jpg",
        token,
        ticket,
      );
    }
    if (t === "video" && msg.video) {
      return this.putMedia(
        "VIDEO",
        msg.video.id,
        msg.video.caption,
        msg.video.mime_type ?? "video/mp4",
        "file.mp4",
        token,
        ticket,
      );
    }
    if (t === "document" && msg.document) {
      const fn = msg.document.filename || "document";
      return this.putMedia(
        "DOCUMENT",
        msg.document.id,
        msg.document.caption,
        msg.document.mime_type ?? "application/octet-stream",
        fn,
        token,
        ticket,
      );
    }
    if (t === "audio" && msg.audio) {
      return this.putMedia("AUDIO", msg.audio.id, null, msg.audio.mime_type ?? "audio/ogg", "file.ogg", token, ticket);
    }
    if (t === "audio" && (msg as WAMessage).voice) {
      const v = (msg as WAMessage).voice!;
      return this.putMedia("AUDIO", v.id, null, v.mime_type ?? "audio/ogg", "file.ogg", token, ticket);
    }
    return { messageType: "TEXT" as const, text: t === "text" ? "" : `[${t}]`, r2ObjectKey: null, mediaMime: null, fileName: null };
  }

  private async putMedia(
    mtype: MessageType,
    mediaId: string | undefined,
    caption: string | null | undefined,
    mime: string,
    fileName: string,
    token: string,
    ticket: TicketEntity,
  ) {
    if (!mediaId) {
      return { messageType: mtype, text: caption ?? "Media (missing id)", r2ObjectKey: null, mediaMime: null, fileName: null };
    }
    if (!this.r2.isEnabled() || !token) {
      return { messageType: mtype, text: caption ?? "Media (set R2 + WHATSAPP_ACCESS_TOKEN to store file)", r2ObjectKey: null, mediaMime: null, fileName: null };
    }
    const buf = await this.fetchMediaById(mediaId, token);
    const key = this.r2.buildKey(ticket.id, fileName);
    await this.r2.putObject(key, buf, mime);
    return { messageType: mtype, text: caption ?? null, r2ObjectKey: key, mediaMime: mime, fileName };
  }

  private async ensureUserAndContact(phone: string, profileName: string | null) {
    const existing = await this.contacts.findByPhone(phone);
    if (existing) {
      const user = await this.users.findById(existing.userId);
      if (user) {
        return { user, contact: existing };
      }
    }
    const email = toInternalEmailFromPhone(phone);
    let u = await this.users.findByEmail(email);
    if (!u) {
      const hash = await this.hasher.hash(`wa-${phoneDigits(phone)}-${Date.now()}`);
      u = await this.users.create({
        name: profileName || `WhatsApp +${phoneDigits(phone)}`,
        email,
        passwordHash: hash,
        role: "CUSTOMER",
      });
    }
    const c = await this.contacts.createForUser({ phoneE164: phone, profileName, userId: u.id });
    return { user: u, contact: c };
  }

  private async ensureWhatsappTicket(whatsappContactId: string, customerId: string, phone: string, profileName: string | null) {
    const t = await this.tickets.findOpenWhatsappByContact(whatsappContactId);
    if (t) {
      return t;
    }
    return this.createTicket.execute({
      title: profileName ? `WhatsApp — ${profileName}` : `WhatsApp ${phone}`,
      description: "Conversation on WhatsApp",
      customerId,
      channel: "WHATSAPP",
      whatsappContactId,
    });
  }

  private async fetchMediaById(mediaId: string, token: string) {
    const v = this.graphV();
    const infoRes = await fetch(`https://graph.facebook.com/${v}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!infoRes.ok) {
      const t = await infoRes.text();
      throw new Error(`Media info failed: ${t}`);
    }
    const info = (await infoRes.json()) as { url?: string };
    if (!info.url) {
      throw new Error("No media url");
    }
    const dataRes = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!dataRes.ok) {
      throw new Error("Media download failed");
    }
    return Buffer.from(await dataRes.arrayBuffer());
  }
}

type WAContact = { profile?: { name?: string } };
type WAMessage = {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string; mime_type?: string };
  video?: { id?: string; caption?: string; mime_type?: string };
  document?: { id?: string; caption?: string; mime_type?: string; filename?: string };
  audio?: { id?: string; mime_type?: string };
  voice?: { id?: string; mime_type?: string };
};
