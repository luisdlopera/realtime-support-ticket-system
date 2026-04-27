"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/tickets/status-badge";
import { useSocket } from "@/lib/hooks/useSocket";
import { Input, Button, Card, CardHeader, CardBody } from "@heroui/react";

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
    <main className="space-y-4 sm:space-y-6">
      <Card className="p-1 sm:p-2">
        <CardHeader className="pb-2">
          <h2 className="text-base font-bold sm:text-lg">Crear ticket</h2>
        </CardHeader>
        <CardBody className="p-2 sm:p-3">
          <form
            className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:items-end"
            onSubmit={createTicket}
          >
            <Input
              label="Título"
              value={title}
              onValueChange={setTitle}
              placeholder="Ej: Problema con la cuenta"
              variant="bordered"
              size="sm"
            />
            <Input
              label="Descripción"
              value={description}
              onValueChange={setDescription}
              placeholder="Explica brevemente..."
              variant="bordered"
              size="sm"
            />
            <Button type="submit" color="primary" className="font-bold h-10 sm:h-12" size="sm">
              Crear ticket
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="p-1 sm:p-2">
        <CardHeader className="pb-2">
          <h2 className="text-base font-bold sm:text-lg">Listado de Tickets</h2>
        </CardHeader>
        <CardBody className="space-y-2 sm:space-y-3 p-2 sm:p-3">
          {tickets.length === 0 && (
            <p className="text-zinc-500 text-center py-6 sm:py-8 text-sm">
              No hay tickets disponibles
            </p>
          )}
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base truncate">
                  {ticket.title}
                </p>
                <p className="text-xs sm:text-sm text-zinc-500 line-clamp-1">
                  {ticket.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={ticket.status} />
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>
    </main>
  );
}
