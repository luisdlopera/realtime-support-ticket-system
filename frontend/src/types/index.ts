export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  customerId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface DashboardMetrics {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  unassigned: number;
}
