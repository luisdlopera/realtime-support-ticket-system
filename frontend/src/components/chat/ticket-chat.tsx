"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TicketMessage } from "@/types";
import { useTicketRoom } from "@/lib/hooks/useTicketRoom";

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

    const onMessage = (event: { data: { message: TicketMessage } }) => {
      setMessages((prev) => [...prev, event.data.message]);
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
    <section className="card flex h-[520px] flex-col p-4">
      <h3 className="mb-3 text-lg font-semibold">Realtime chat</h3>
      <div className="mb-3 flex-1 space-y-2 overflow-y-auto rounded-md border border-gray-700 p-3">
        {messages.map((message) => (
          <article key={message.id} className="rounded-md bg-gray-800 p-2">
            <p className="text-sm">{message.content}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(message.createdAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
      {typingUsers.length > 0 ? <p className="mb-2 text-xs text-gray-400">Someone is typing...</p> : null}
      <form className="flex gap-2" onSubmit={submitMessage}>
        <input
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            socket.emit("ticket.typing", { ticketId, isTyping: true });
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2"
        />
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
          Send
        </button>
      </form>
    </section>
  );
}
