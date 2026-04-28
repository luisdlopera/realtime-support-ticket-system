"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/tickets/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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
    if (!title.trim() || !description.trim()) return;
    await api.createTicket({ title, description });
    setTitle("");
    setDescription("");
    await loadTickets();
  }

  return (
    <main className="space-y-4 sm:space-y-6">
      <Card className="border border-zinc-200/70 p-1 shadow-sm dark:border-zinc-700/70 dark:bg-content1 sm:p-2">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <h2 className="text-base font-bold sm:text-lg">Crear ticket</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Registra una solicitud y se actualizará para todos en tiempo real.
          </p>
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
              size="sm"
            />
            <Input
              label="Descripción"
              value={description}
              onValueChange={setDescription}
              placeholder="Explica brevemente..."
              size="sm"
            />
            <Button
              type="submit"
              color="primary"
              className="h-10 font-bold shadow-sm sm:h-12"
              size="sm"
              isDisabled={!title.trim() || !description.trim()}
            >
              Crear ticket
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="border border-zinc-200/70 p-1 shadow-sm dark:border-zinc-700/70 dark:bg-content1 sm:p-2">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <h2 className="text-base font-bold sm:text-lg">Listado de tickets</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Abre un ticket para ver su detalle y conversación.
          </p>
        </CardHeader>
        <CardBody className="space-y-2 sm:space-y-3 p-2 sm:p-3">
          {tickets.length === 0 && <EmptyState type="tickets" />}
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700/70 dark:hover:bg-content2 sm:flex-row sm:items-center sm:justify-between sm:p-4"
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
