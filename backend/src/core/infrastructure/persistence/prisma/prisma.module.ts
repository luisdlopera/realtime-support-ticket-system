import { Global, Module } from "@nestjs/common";
import { TOKENS } from "../../../application/ports/ports";
import {
  PrismaMessageRepository,
  PrismaNotificationRepository,
  PrismaTicketRepository,
  PrismaUserRepository,
  PrismaWhatsappContactRepository,
} from "./repositories/prisma.repositories";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaUserRepository,
    PrismaWhatsappContactRepository,
    PrismaTicketRepository,
    PrismaMessageRepository,
    PrismaNotificationRepository,
    { provide: TOKENS.USER_REPOSITORY, useExisting: PrismaUserRepository },
    { provide: TOKENS.WHATSAPP_CONTACT_REPOSITORY, useExisting: PrismaWhatsappContactRepository },
    { provide: TOKENS.TICKET_REPOSITORY, useExisting: PrismaTicketRepository },
    { provide: TOKENS.MESSAGE_REPOSITORY, useExisting: PrismaMessageRepository },
    { provide: TOKENS.NOTIFICATION_REPOSITORY, useExisting: PrismaNotificationRepository },
  ],
  exports: [
    PrismaService,
    TOKENS.USER_REPOSITORY,
    TOKENS.WHATSAPP_CONTACT_REPOSITORY,
    TOKENS.TICKET_REPOSITORY,
    TOKENS.MESSAGE_REPOSITORY,
    TOKENS.NOTIFICATION_REPOSITORY,
  ],
})
export class PrismaModule {}
