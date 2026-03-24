"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Ticket, TicketStatus } from "@/types";
import { StatusBadge } from "@/components/tickets/status-badge";
import { TicketChat } from "@/components/chat/ticket-chat";
import { useTicketRoom } from "@/lib/hooks/useTicketRoom";

const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const socket = useTicketRoom(ticketId);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  async function loadTicket() {
    const data = await api.getTicket(ticketId);
    setTicket(data as Ticket);
  }

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
  }, [socket, ticketId]);

  if (!ticket) {
    return <p>Loading ticket...</p>;
  }

  return (
    <main className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <section className="card space-y-4 p-4">
        <h2 className="text-xl font-semibold">{ticket.title}</h2>
        <p className="text-gray-300">{ticket.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="grid gap-2">
          <p className="text-sm text-gray-400">Change status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => api.changeTicketStatus(ticket.id, status).then(loadTicket)}
                className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>
      <TicketChat ticketId={ticket.id} />
    </main>
  );
}
