export const DOMAIN_EVENTS = {
  TICKET_CREATED: "ticket.created",
  TICKET_ASSIGNED: "ticket.assigned",
  TICKET_MESSAGE: "ticket.message",
  TICKET_STATUS_CHANGED: "ticket.status.changed",
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
