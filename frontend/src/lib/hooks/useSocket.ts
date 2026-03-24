"use client";

import { useEffect, useMemo } from "react";
import { connectSocket } from "../socket";

export function useSocket() {
  const socket = useMemo(() => connectSocket(), []);

  useEffect(() => {
    return () => {
      socket.off();
    };
  }, [socket]);

  return socket;
}
