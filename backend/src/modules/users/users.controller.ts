import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { TOKENS, UserRepositoryPort } from "../../core/application/ports/ports";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(@Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  @Get("agents")
  @Roles("AGENT", "ADMIN")
  listAgents() {
    return this.userRepository.findAgents();
  }
}
