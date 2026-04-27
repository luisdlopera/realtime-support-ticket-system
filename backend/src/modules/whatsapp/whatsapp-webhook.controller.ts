import { Controller, Get, Post, Query, Req, HttpCode, UnauthorizedException, ForbiddenException, RawBody } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { WhatsappInboundService } from "./whatsapp-inbound.service";
import { verifyMetaSignature } from "./verify-signature.util";

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
    throw new ForbiddenException();
  }

  @Post("webhook")
  @HttpCode(200)
  async receive(@Req() req: Request & { rawBody?: Buffer }, @RawBody() rawBody: Buffer) {
    const appSecret = this.config.get<string>("whatsapp.appSecret") ?? "";
    const sig = (req.headers["x-hub-signature-256"] as string | undefined) || "";
    const buf = rawBody && rawBody.length ? rawBody : req.rawBody;
    if (appSecret) {
      if (!buf || !verifyMetaSignature(appSecret, buf, sig)) {
        throw new UnauthorizedException("Invalid signature");
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new UnauthorizedException("WHATSAPP_APP_SECRET is required in production");
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
