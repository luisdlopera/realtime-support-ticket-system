"use client";

import { Ticket, WhatsappInboxRow } from "@/types";
import { Avatar, Button } from "@heroui/react";
import { ArrowLeft, UserX } from "lucide-react";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const statusLabels: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

interface ChatHeaderProps {
  ticket: Ticket;
  contact: WhatsappInboxRow["contact"] | null;
  onClose: () => void;
  onBack?: () => void;
}

export function ChatHeader({ ticket, contact, onClose, onBack }: ChatHeaderProps) {
  const name = contact?.profileName || contact?.phoneE164 || "Chat";
  const phone = contact?.phoneE164 || "";
  const status = statusLabels[ticket.status] || ticket.status;

  return (
    <header className="flex h-[60px] items-center gap-2 bg-wa-header-light px-3 dark:bg-wa-header-dark flex-shrink-0 border-b border-wa-border-light dark:border-wa-border-dark">
      {/* Back button for mobile */}
      {onBack && (
        <Button isIconOnly variant="light" radius="full" onPress={onBack} className="lg:hidden">
          <ArrowLeft size={20} />
        </Button>
      )}

      {/* Avatar */}
      <Avatar
        name={initials(name)}
        size="sm"
        radius="full"
        className="flex-shrink-0"
        classNames={{
          base: "bg-zinc-200 dark:bg-zinc-700",
          name: "text-zinc-600 dark:text-zinc-300",
        }}
      />

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col ml-1">
        <span className="truncate text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
          {name}
        </span>
        <span className="text-xs text-wa-time dark:text-wa-time-dark truncate">
          {phone}
          {phone && " · "}
          {status}
        </span>
      </div>

      {/* Actions */}
      {ticket.status !== "CLOSED" && (
        <Button
          size="sm"
          variant="flat"
          color="danger"
          onPress={onClose}
          startContent={<UserX size={16} />}
          className="font-medium px-2 min-w-unit-12 h-8"
        >
          <span className="hidden sm:inline">Cerrar ticket</span>
        </Button>
      )}
    </header>
  );
}
