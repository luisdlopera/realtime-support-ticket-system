"use client";

import { useState } from "react";
import { WhatsappInboxRow, TicketMessage } from "@/types";
import { Search, Filter, MessageCircle, Calendar } from "lucide-react";
import { Input, Button, Badge, Avatar } from "@heroui/react";

function getBody(m: TicketMessage) {
  return m.text ?? (m as { content?: string }).content ?? "";
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface InboxListProps {
  inbox: WhatsappInboxRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filterFrom: string;
  filterTo: string;
  onFilterFromChange: (v: string) => void;
  onFilterToChange: (v: string) => void;
  onApplyFilters: () => void;
  isMobile?: boolean;
}

export function InboxList({
  inbox,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filterFrom,
  filterTo,
  onFilterFromChange,
  onFilterToChange,
  onApplyFilters,
  isMobile,
}: InboxListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  // On mobile, we want to show full width when isMobile is true
  // On desktop (lg+), we always show the sidebar
  const mobileVisibleClass = isMobile ? "flex w-full" : "hidden lg:flex";

  return (
    <aside
      className={`${mobileVisibleClass} flex-col border-r border-wa-border-light bg-white dark:border-wa-border-dark dark:bg-wa-panel-dark lg:w-full lg:max-w-[380px] xl:max-w-[420px]`}
    >
      {/* Header */}
      <div className="flex h-[56px] items-center justify-between bg-wa-header-light px-3 dark:bg-wa-header-dark sm:px-4">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 sm:text-lg">
          Chats
        </h2>
        <Button
          isIconOnly
          variant="light"
          radius="full"
          size="sm"
          onPress={() => setFiltersOpen(!filtersOpen)}
          className={`text-wa-time dark:text-wa-time-dark ${filtersOpen ? "bg-wa-active-light dark:bg-wa-active-dark" : ""}`}
          aria-label={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          aria-expanded={filtersOpen}
        >
          <Filter size={18} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 py-2 sm:px-3">
        <Input
          placeholder="Buscar o empezar un chat"
          value={search}
          onValueChange={onSearchChange}
          startContent={<Search size={16} className="text-wa-time dark:text-wa-time-dark" />}
          variant="flat"
          radius="lg"
          size="sm"
          classNames={{
            inputWrapper: "bg-wa-search-light dark:bg-wa-search-dark h-9 sm:h-10",
            input: "text-sm",
          }}
          aria-label="Buscar conversaciones"
        />
      </div>

      {/* Collapsible filters */}
      {filtersOpen && (
        <div className="border-b border-wa-border-light px-2 pb-3 dark:border-wa-border-dark animate-in fade-in slide-in-from-top-2 duration-200 sm:px-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Input
              type="date"
              label="Desde"
              labelPlacement="outside"
              value={filterFrom}
              onValueChange={onFilterFromChange}
              size="sm"
              variant="bordered"
              startContent={<Calendar size={14} className="text-wa-time" />}
              classNames={{
                inputWrapper: "h-9",
                label: "text-xs",
              }}
            />
            <Input
              type="date"
              label="Hasta"
              labelPlacement="outside"
              value={filterTo}
              onValueChange={onFilterToChange}
              size="sm"
              variant="bordered"
              startContent={<Calendar size={14} className="text-wa-time" />}
              classNames={{
                inputWrapper: "h-9",
                label: "text-xs",
              }}
            />
          </div>
          <Button
            fullWidth
            size="sm"
            color="primary"
            className="bg-wa-teal font-medium h-9"
            onPress={onApplyFilters}
          >
            Aplicar filtros
          </Button>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {inbox.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-wa-time dark:text-wa-time-dark">
            <MessageCircle size={40} className="mb-3 opacity-20" />
            <p className="text-sm">No hay conversaciones</p>
          </div>
        )}
        {inbox.map((row) => {
          const name = row.contact.profileName || row.contact.phoneE164;
          const isActive = selectedId === row.ticket.id;
          const lastTime = row.lastMessage?.createdAt ?? row.ticket.createdAt;
          const preview = row.lastMessage
            ? getBody(row.lastMessage) || (row.lastMessage.r2ObjectKey ? "📎 Media" : "")
            : "Sin mensajes";

          return (
            <button
              key={row.ticket.id}
              type="button"
              onClick={() => onSelect(row.ticket.id)}
              className={`flex w-full items-center gap-2 px-2 py-2 text-left transition-colors sm:gap-3 sm:px-3 sm:py-3 ${
                isActive
                  ? "bg-wa-active-light dark:bg-wa-active-dark"
                  : "hover:bg-wa-hover-light dark:hover:bg-wa-hover-dark"
              }`}
              aria-selected={isActive}
              role="option"
            >
              {/* Avatar */}
              <Avatar
                name={initials(name)}
                radius="full"
                size="sm"
                className="flex-shrink-0 sm:size-md"
                classNames={{
                  base: "bg-zinc-200 dark:bg-zinc-700 h-10 w-10 sm:h-12 sm:w-12",
                  name: "text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm",
                }}
              />

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col border-b border-wa-border-light py-0.5 dark:border-wa-border-dark">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-normal text-zinc-900 dark:text-zinc-100 sm:text-[15px]">
                    {name}
                  </span>
                  <span
                    className={`ml-2 flex-shrink-0 text-[11px] sm:text-xs ${
                      row.unreadCount > 0
                        ? "font-medium text-wa-badge"
                        : "text-wa-time dark:text-wa-time-dark"
                    }`}
                  >
                    {formatTime(lastTime)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="truncate text-xs text-wa-time dark:text-wa-time-dark sm:text-[13px]">
                    {preview}
                  </p>
                  {row.unreadCount > 0 && (
                    <Badge
                      color="success"
                      content={row.unreadCount > 99 ? "99+" : row.unreadCount}
                      shape="circle"
                      size="sm"
                      className="bg-wa-badge border-none text-white font-bold flex-shrink-0"
                    >
                      <div className="w-0 h-0" />
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
