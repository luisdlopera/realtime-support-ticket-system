"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Ticket, TicketStatus } from "@/types";
import { StatusBadge } from "@/components/tickets/status-badge";
import { TicketChat } from "@/components/chat/ticket-chat";
import { useTicketRoom } from "@/lib/hooks/useTicketRoom";
import { Button } from "@heroui/react";

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const socket = useTicketRoom(ticketId);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    const data = await api.getTicket(ticketId);
    setTicket(data as Ticket);
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    void loadTicket();

    const refresh = () => void loadTicket();
    socket.on("ticket.assigned", refresh);
    socket.on("ticket.status.changed", refresh);
    return () => {
      socket.off("ticket.assigned", refresh);
      socket.off("ticket.status.changed", refresh);
    };
  }, [socket, ticketId, loadTicket]);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">Cargando ticket...</p>
      </div>
    );
  }

  return (
    <main className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="card space-y-4 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl break-words">{ticket.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Creado: {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
          {ticket.description}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Estado:</span>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="grid gap-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Button
                key={status}
                onPress={() => api.changeTicketStatus(ticket.id, status).then(() => loadTicket())}
                size="sm"
                variant={ticket.status === status ? "solid" : "bordered"}
                color={ticket.status === status ? "primary" : "default"}
                className="text-xs sm:text-sm"
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>
      </section>
      <TicketChat ticketId={ticket.id} />
    </main>
  );
}
