"use client";

import { useEffect, useMemo } from "react";
import { connectSocket } from "../socket";

export function useSocket() {
  const socket = useMemo(() => connectSocket(), []);

  useEffect(() => {
    // Cleanup: solo desconectar listeners específicos que este componente haya creado
    // NOTA: No usamos socket.off() sin argumentos porque removería TODOS los listeners
    // globalmente, afectando otros componentes. En su lugar, cada componente debe
    // limpiar sus propios listeners usando socket.off(eventName, handler).
    return () => {
      // No hacemos nada aquí - cada componente debe limpiar sus propios listeners
      // usando socket.off(eventName, handler) en sus propios useEffect cleanup
    };
  }, [socket]);

  return socket;
}
