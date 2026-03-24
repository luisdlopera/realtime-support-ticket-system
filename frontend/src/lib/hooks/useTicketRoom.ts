"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";

export function useTicketRoom(ticketId: string) {
  const socket = useSocket();

  useEffect(() => {
    if (!ticketId) return;
    socket.emit("ticket.join", { ticketId });
    return () => {
      socket.emit("ticket.leave", { ticketId });
    };
  }, [socket, ticketId]);

  return socket;
}
