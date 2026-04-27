import { Module, forwardRef } from "@nestjs/common";
import { WhatsappWebhookController } from "./whatsapp-webhook.controller";
import { WhatsappInboundService } from "./whatsapp-inbound.service";
import { WhatsappOutboundService } from "./whatsapp-outbound.service";
import { TicketsModule } from "../tickets/tickets.module";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [TicketsModule, forwardRef(() => MessagesModule)],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappInboundService, WhatsappOutboundService],
  exports: [WhatsappOutboundService],
})
export class WhatsappModule {}
