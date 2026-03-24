"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/tickets/status-badge";
import { useSocket } from "@/lib/hooks/useSocket";

export default function TicketsPage() {
  const socket = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function loadTickets() {
    const data = await api.listTickets();
    setTickets(data as Ticket[]);
  }

  useEffect(() => {
    void loadTickets();
    const refresh = () => void loadTickets();
    socket.on("ticket.created", refresh);
    socket.on("ticket.assigned", refresh);
    socket.on("ticket.status.changed", refresh);
    return () => {
      socket.off("ticket.created", refresh);
      socket.off("ticket.assigned", refresh);
      socket.off("ticket.status.changed", refresh);
    };
  }, [socket]);

  async function createTicket(event: FormEvent) {
    event.preventDefault();
    await api.createTicket({ title, description });
    setTitle("");
    setDescription("");
    await loadTickets();
  }

  return (
    <main className="space-y-6">
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-semibold">Create ticket</h2>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={createTicket}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2"
          />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
            Create
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-semibold">Tickets</h2>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="flex items-center justify-between rounded-md border border-gray-700 p-3 hover:bg-gray-800"
            >
              <div>
                <p className="font-medium">{ticket.title}</p>
                <p className="text-sm text-gray-400">{ticket.description}</p>
              </div>
              <StatusBadge status={ticket.status} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
