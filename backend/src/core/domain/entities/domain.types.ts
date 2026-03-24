export type UserRole = "CUSTOMER" | "AGENT" | "ADMIN";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export const USER_ROLES: UserRole[] = ["CUSTOMER", "AGENT", "ADMIN"];
export const TICKET_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketEntity {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  customerId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessageEntity {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}
