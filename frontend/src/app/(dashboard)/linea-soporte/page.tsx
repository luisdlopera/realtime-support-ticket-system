"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/hooks/useSocket";
import { useTicketRoom } from "@/lib/hooks/useTicketRoom";
import { Ticket, TicketMessage, WhatsappInboxRow } from "@/types";
import { InboxList } from "@/components/linea-soporte/InboxList";
import { ChatHeader } from "@/components/linea-soporte/ChatHeader";
import { MessageBubble } from "@/components/linea-soporte/MessageBubble";
import { Composer } from "@/components/linea-soporte/Composer";
import { MessageSquare } from "lucide-react";

function getBody(m: TicketMessage) {
  return m.text ?? (m as { content?: string }).content ?? "";
}

function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("support_user");
    if (!raw) return null;
    return (JSON.parse(raw) as { id: string }).id;
  } catch {
    return null;
  }
}

function currentRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("support_user");
    if (!raw) return null;
    return (JSON.parse(raw) as { role: string }).role;
  } catch {
    return null;
  }
}

export default function LineaSoportePage() {
  const [inbox, setInbox] = useState<WhatsappInboxRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<TicketMessage | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [showInbox, setShowInbox] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const me = currentUserId();
  const role = currentRole();
  const socket = useSocket();
  const room = useTicketRoom(selectedId ?? "");

  const loadInbox = useCallback(async () => {
    setError(null);
    try {
      const q: { from?: string; to?: string; search?: string } = {};
      if (filterFrom) q.from = new Date(filterFrom).toISOString();
      if (filterTo) {
        const d = new Date(filterTo);
        d.setHours(23, 59, 59, 999);
        q.to = d.toISOString();
      }
      if (search.trim()) q.search = search.trim();
      const data = await api.listWhatsappInbox(q);
      setInbox(data as WhatsappInboxRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el inbox");
    }
  }, [filterFrom, filterTo, search]);

  useEffect(() => {
    if (role !== "AGENT" && role !== "ADMIN") return;
    void loadInbox();
  }, [loadInbox, role]);

  useEffect(() => {
    if (role !== "AGENT" && role !== "ADMIN") return;
    const onRefresh = () => void loadInbox();
    socket.on("ticket.created", onRefresh);
    socket.on("ticket.assigned", onRefresh);
    socket.on("ticket.status.changed", onRefresh);
    socket.on("ticket.message", onRefresh);
    return () => {
      socket.off("ticket.created", onRefresh);
      socket.off("ticket.assigned", onRefresh);
      socket.off("ticket.status.changed", onRefresh);
      socket.off("ticket.message", onRefresh);
    };
  }, [socket, loadInbox, role]);

  const loadMessages = useCallback(
    async (tid: string) => {
      const data = (await api.listMessages(tid)) as TicketMessage[];
      setMessages(data);
      await api.markMessagesRead(tid);
      void loadInbox();
    },
    [loadInbox],
  );

  useEffect(() => {
    if (!selectedId) {
      setTicket(null);
      setMessages([]);
      return;
    }
    (async () => {
      setError(null);
      try {
        const t = (await api.getTicket(selectedId)) as Ticket;
        setTicket(t);
        await loadMessages(selectedId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar ticket");
      }
    })();
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId) return;
    const onMsg = (payload: { ticketId: string; data: { message: TicketMessage } }) => {
      if (payload.ticketId !== selectedId) return;
      setMessages((prev) => {
        if (prev.some((x) => x.id === payload.data.message.id)) return prev;
        return [...prev, payload.data.message];
      });
      void loadInbox();
    };
    room.on("ticket.message", onMsg);
    return () => {
      room.off("ticket.message", onMsg);
    };
  }, [room, selectedId, loadInbox]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    void (async () => {
      for (const m of messages) {
        if (!m.r2ObjectKey) continue;
        const { url } = await api.getMessageMediaInfo(selectedId, m.id);
        setMediaUrls((prev) => (prev[m.id] ? prev : { ...prev, [m.id]: url }));
      }
    })();
  }, [messages, selectedId]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const t = text.trim();
    if (!t && !fileRef.current?.files?.length) return;
    setError(null);
    try {
      if (fileRef.current?.files?.[0]) {
        await api.createMessageWithMedia(selectedId, {
          text: t || undefined,
          file: fileRef.current.files[0],
          replyToMessageId: replyTo?.id,
        });
        fileRef.current.value = "";
      } else {
        await api.postMessage(selectedId, { text: t, replyToMessageId: replyTo?.id });
      }
      setText("");
      setReplyTo(null);
      if (selectedId) await loadMessages(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    }
  }

  async function closeTicket() {
    if (!selectedId) return;
    if (!window.confirm("¿Cerrar este ticket?")) return;
    await api.changeTicketStatus(selectedId, "CLOSED");
    await loadInbox();
    if (selectedId) {
      setTicket((t) => (t ? { ...t, status: "CLOSED" } : t));
    }
  }

  if (role && role !== "AGENT" && role !== "ADMIN") {
    return (
      <main className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-wa-panel-light dark:bg-wa-panel-dark lg:h-[calc(100vh-4rem)]">
        <p className="text-wa-time dark:text-wa-time-dark px-4 text-center">
          La línea de soporte tipo WhatsApp está disponible solo para agentes o administradores.
        </p>
      </main>
    );
  }

  const activeRow = inbox.find((i) => i.ticket.id === selectedId) ?? null;

  const replyPreviews: Record<string, string> = {};
  for (const m of messages) {
    if (m.replyToId) {
      const parent = messages.find((x) => x.id === m.replyToId);
      if (parent) replyPreviews[m.id] = getBody(parent);
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShowInbox(false);
  };

  const handleBack = () => {
    setShowInbox(true);
    setSelectedId(null);
  };

  return (
    <main className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-lg shadow-lg relative bg-white dark:bg-wa-panel-dark lg:h-[calc(100vh-4rem)] xl:h-[min(90vh,920px)] xl:min-h-[480px]">
      {error && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-red-500/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Sidebar: inbox */}
      <InboxList
        inbox={inbox}
        selectedId={selectedId}
        onSelect={handleSelect}
        search={search}
        onSearchChange={setSearch}
        filterFrom={filterFrom}
        filterTo={filterTo}
        onFilterFromChange={setFilterFrom}
        onFilterToChange={setFilterTo}
        onApplyFilters={() => void loadInbox()}
        isMobile={showInbox}
      />

      {/* Chat panel */}
      <section
        className={`flex min-w-0 flex-1 flex-col bg-wa-chat-light dark:bg-wa-chat-dark ${!showInbox ? "flex" : "hidden lg:flex"}`}
      >
        {ticket && selectedId ? (
          <>
            <ChatHeader
              ticket={ticket}
              contact={activeRow?.contact ?? null}
              onClose={() => void closeTicket()}
              onBack={handleBack}
            />

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              className="wa-chat-bg-light dark:wa-chat-bg-dark flex-1 overflow-y-auto overscroll-contain py-2 px-1 sm:px-2"
            >
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isAgent={m.authorId === me}
                  mediaUrl={mediaUrls[m.id]}
                  onReply={setReplyTo}
                  replyPreview={replyPreviews[m.id]}
                />
              ))}
              <div ref={bottomRef} className="h-1" />
            </div>

            <Composer
              text={text}
              onTextChange={setText}
              onSubmit={onSend}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              fileRef={fileRef}
              disabled={ticket.status === "CLOSED"}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-wa-panel-light dark:bg-wa-panel-dark px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-wa-border-light dark:bg-wa-border-dark sm:h-20 sm:w-20">
              <MessageSquare
                size={32}
                className="text-wa-time/30 dark:text-wa-time-dark/30 sm:size-48"
              />
            </div>
            <h3 className="text-xl font-light text-zinc-700 dark:text-zinc-300 sm:text-2xl">
              Línea de Soporte
            </h3>
            <p className="max-w-xs text-center text-sm text-wa-time dark:text-wa-time-dark sm:max-w-sm">
              Selecciona una conversación del panel izquierdo para empezar a chatear.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
