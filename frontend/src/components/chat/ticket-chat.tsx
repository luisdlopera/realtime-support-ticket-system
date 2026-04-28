"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TicketMessage } from "@/types";
import { useTicketRoom } from "@/lib/hooks/useTicketRoom";
import { Card, CardHeader, CardBody, Input, Button } from "@heroui/react";

export function TicketChat({ ticketId }: { ticketId: string }) {
  const socket = useTicketRoom(ticketId);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    async function loadMessages() {
      const data = await api.listMessages(ticketId);
      setMessages(data as TicketMessage[]);
    }
    void loadMessages();

    const onMessage = (payload: { data: { message: TicketMessage } }) => {
      setMessages((prev) => {
        if (prev.some((x) => x.id === payload.data.message.id)) return prev;
        return [...prev, payload.data.message];
      });
    };
    const onTyping = (event: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (event.isTyping && !prev.includes(event.userId)) return [...prev, event.userId];
        if (!event.isTyping) return prev.filter((id) => id !== event.userId);
        return prev;
      });
    };

    socket.on("ticket.message", onMessage);
    socket.on("ticket.typing", onTyping);
    return () => {
      socket.off("ticket.message", onMessage);
      socket.off("ticket.typing", onTyping);
    };
  }, [socket, ticketId]);

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    await api.createMessage(ticketId, content.trim());
    setContent("");
    socket.emit("ticket.typing", { ticketId, isTyping: false });
  }

  return (
    <Card className="h-[400px] border border-zinc-200/70 p-1 shadow-sm dark:border-zinc-800 sm:h-[480px] sm:p-2 lg:h-[520px]">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <h3 className="text-base font-bold sm:text-lg">Chat en tiempo real</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Mensajes sincronizados por socket</p>
      </CardHeader>
      <CardBody className="flex flex-col p-2 sm:p-3">
        <div className="mb-3 flex-1 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700/70 dark:bg-content2/60 sm:space-y-3 sm:p-4">
          {messages.length === 0 && (
            <p className="text-center text-zinc-500 py-8 sm:py-10 text-sm">No hay mensajes aún</p>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-xl border border-zinc-100 bg-white p-2 shadow-sm dark:border-zinc-700/70 dark:bg-content2 sm:p-3"
            >
              <p className="text-[13px] sm:text-[14px]">
                {(message as { text?: string; content?: string }).text ??
                  (message as { content?: string }).content ??
                  ""}
              </p>
              <p className="mt-1 text-[10px] text-zinc-400 font-medium uppercase">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
        {typingUsers.length > 0 ? (
          <p className="mb-2 text-xs text-zinc-500 animate-pulse italic">
            Alguien está escribiendo...
          </p>
        ) : null}
        <form className="flex gap-2" onSubmit={submitMessage}>
          <Input
            value={content}
            onValueChange={(val) => {
              setContent(val);
              socket.emit("ticket.typing", { ticketId, isTyping: true });
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            size="sm"
          />
          <Button type="submit" color="primary" className="font-bold" size="sm">
            Enviar
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
