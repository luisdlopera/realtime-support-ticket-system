import { io, Socket } from "socket.io-client";
import { authStorage } from "./auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001/realtime";

let socketInstance: Socket | null = null;

export function getSocket() {
  if (socketInstance) return socketInstance;
  socketInstance = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"], // Fallback a polling si websocket falla
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });

  // Manejar errores de conexión
  socketInstance.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    // Reconectar manualmente si el servidor cerró la conexión
    if (reason === "io server disconnect") {
      // El servidor cerró la conexión, necesitamos reconectar manualmente
      setTimeout(() => {
        socketInstance?.connect();
      }, 1000);
    }
  });

  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  const token = authStorage.getToken();
  if (token) {
    socket.auth = { token };
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
