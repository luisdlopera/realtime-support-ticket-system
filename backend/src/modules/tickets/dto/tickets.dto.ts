import { IsIn, IsOptional, IsString } from "class-validator";
import { TicketStatus, TICKET_STATUSES } from "../../../core/domain/entities/domain.types";

export class CreateTicketDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;
}

export class AssignTicketDto {
  @IsString()
  assigneeId!: string;
}

export class ChangeTicketStatusDto {
  @IsIn(TICKET_STATUSES)
  status!: TicketStatus;
}

export class ListTicketsQueryDto {
  @IsIn(TICKET_STATUSES)
  @IsOptional()
  status?: TicketStatus;
}

export class InboxWhatsappQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsIn(TICKET_STATUSES)
  @IsOptional()
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
