import { TicketStatus } from "@/types";

const styles: Record<TicketStatus, string> = {
  OPEN: "bg-blue-500/20 text-blue-300",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-300",
  RESOLVED: "bg-green-500/20 text-green-300",
  CLOSED: "bg-gray-500/20 text-gray-300",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}
