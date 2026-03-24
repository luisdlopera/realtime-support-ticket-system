import { DomainEventName } from "./domain-events.constants";

export interface DomainEvent<T = Record<string, unknown>> {
  eventId: string;
  type: DomainEventName;
  occurredAt: string;
  actorUserId: string;
  ticketId: string;
  data: T;
}
