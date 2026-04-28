import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { TOKENS, TokenServicePort } from "../../core/application/ports/ports";
import { ERROR_MESSAGES } from "../constants/error-messages.constants";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKENS.TOKEN_SERVICE) private readonly tokenService: TokenServicePort) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MISSING_TOKEN);
    }
    const token = authHeader.replace("Bearer ", "");
    try {
      request.user = this.tokenService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }
}
