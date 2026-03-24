import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, AuthUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  AssignTicketUseCase,
  ChangeTicketStatusUseCase,
  CreateTicketUseCase,
  GetDashboardMetricsUseCase,
  GetTicketUseCase,
  ListTicketsUseCase,
} from "../../core/application/use-cases/tickets/tickets.use-cases";
import { AssignTicketDto, ChangeTicketStatusDto, CreateTicketDto, ListTicketsQueryDto } from "./dto/tickets.dto";

@Controller("tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly listTicketsUseCase: ListTicketsUseCase,
    private readonly getTicketUseCase: GetTicketUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly changeTicketStatusUseCase: ChangeTicketStatusUseCase,
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.createTicketUseCase.execute({
      ...dto,
      customerId: user.sub,
    });
  }

  @Get()
  list(@Query() query: ListTicketsQueryDto, @CurrentUser() user: AuthUser) {
    const customerId = user.role === "CUSTOMER" ? user.sub : undefined;
    return this.listTicketsUseCase.execute({
      status: query.status,
      customerId,
    });
  }

  @Get("metrics/dashboard")
  @Roles("AGENT", "ADMIN")
  metrics() {
    return this.getDashboardMetricsUseCase.execute();
  }

  @Get(":id")
  get(@Param("id") ticketId: string) {
    return this.getTicketUseCase.execute(ticketId);
  }

  @Patch(":id/assign")
  @Roles("AGENT", "ADMIN")
  assign(@Param("id") ticketId: string, @Body() dto: AssignTicketDto, @CurrentUser() user: AuthUser) {
    return this.assignTicketUseCase.execute({
      ticketId,
      assigneeId: dto.assigneeId,
      actorUserId: user.sub,
    });
  }

  @Patch(":id/status")
  @Roles("AGENT", "ADMIN")
  changeStatus(@Param("id") ticketId: string, @Body() dto: ChangeTicketStatusDto, @CurrentUser() user: AuthUser) {
    return this.changeTicketStatusUseCase.execute({
      ticketId,
      status: dto.status,
      actorUserId: user.sub,
    });
  }
}
