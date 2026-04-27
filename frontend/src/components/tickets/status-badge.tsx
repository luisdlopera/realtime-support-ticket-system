import { TicketStatus } from "@/types";
import { Chip } from "@heroui/react";

const config: Record<
  TicketStatus,
  { color: "primary" | "warning" | "success" | "default"; label: string }
> = {
  OPEN: { color: "primary", label: "Abierto" },
  IN_PROGRESS: { color: "warning", label: "En progreso" },
  RESOLVED: { color: "success", label: "Resuelto" },
  CLOSED: { color: "default", label: "Cerrado" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const item = config[status] || { color: "default", label: status };
  return (
    <Chip size="sm" variant="flat" color={item.color} className="font-medium">
      {item.label}
    </Chip>
  );
}
