import { Controller, Get, Post, Query, Req, HttpCode, UnauthorizedException, ForbiddenException, RawBody } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { WhatsappInboundService } from "./whatsapp-inbound.service";
import { verifyMetaSignature } from "./verify-signature.util";
import { ERROR_MESSAGES } from "../../common/constants/error-messages.constants";

@Controller("whatsapp")
export class WhatsappWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly inbound: WhatsappInboundService,
  ) {}

  @Get("webhook")
  verify(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    const w = this.config.get<{ verifyToken: string }>("whatsapp");
    const expected = w?.verifyToken ?? "";
    if (mode === "subscribe" && token && token === expected) {
      return challenge;
    }
    throw new ForbiddenException(ERROR_MESSAGES.GENERIC.FORBIDDEN);
  }

  @Post("webhook")
  @HttpCode(200)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 webhooks por minuto
  async receive(@Req() req: Request & { rawBody?: Buffer }, @RawBody() rawBody: Buffer) {
    const appSecret = this.config.get<string>("whatsapp.appSecret") ?? "";
    const sig = (req.headers["x-hub-signature-256"] as string | undefined) || "";
    const buf = rawBody && rawBody.length ? rawBody : req.rawBody;

    // Validación estricta: appSecret debe existir y tener contenido
    const isProduction = process.env.NODE_ENV === "production";
    const hasValidSecret = appSecret && appSecret.length > 0;

    if (isProduction && !hasValidSecret) {
      throw new UnauthorizedException(ERROR_MESSAGES.VALIDATION.MISSING_APP_SECRET);
    }

    if (hasValidSecret) {
      if (!buf || !verifyMetaSignature(appSecret, buf, sig)) {
        throw new UnauthorizedException(ERROR_MESSAGES.VALIDATION.INVALID_SIGNATURE);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any;
    if (body?.object === "whatsapp_business_account" && body.entry) {
      for (const ent of body.entry) {
        for (const ch of ent.changes || []) {
          if (ch.value) {
            await this.inbound.processWebhook(ch.value);
          }
        }
      }
    }
  }
}
