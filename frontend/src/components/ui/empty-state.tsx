import { Inbox, MessageSquare, Ticket, Search } from "lucide-react";

interface EmptyStateProps {
  type: "tickets" | "messages" | "inbox" | "search" | "notifications";
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const icons = {
  tickets: Ticket,
  messages: MessageSquare,
  inbox: Inbox,
  search: Search,
  notifications: Inbox,
};

const defaultTitles = {
  tickets: "No hay tickets",
  messages: "No hay mensajes",
  inbox: "No hay conversaciones",
  search: "No se encontraron resultados",
  notifications: "No hay notificaciones",
};

const defaultDescriptions = {
  tickets: "Los tickets aparecerán aquí cuando los clientes los creen.",
  messages: "Los mensajes del chat aparecerán aquí.",
  inbox: "Las conversaciones de WhatsApp aparecerán aquí.",
  search: "Intenta con otros términos de búsqueda.",
  notifications: "Te notificaremos cuando haya actividad importante.",
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon size={28} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title || defaultTitles[type]}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        {description || defaultDescriptions[type]}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
