import { IsIn, IsOptional, IsString } from "class-validator";
import { MESSAGE_TYPES, MessageType } from "../../../core/domain/entities/domain.types";

export class CreateMessageJsonDto {
  @IsString()
  @IsOptional()
  text?: string;

  /** @deprecated use text */
  @IsString()
  @IsOptional()
  content?: string;

  @IsIn(MESSAGE_TYPES)
  @IsOptional()
  messageType?: MessageType;

  @IsString()
  @IsOptional()
  replyToMessageId?: string;
}
