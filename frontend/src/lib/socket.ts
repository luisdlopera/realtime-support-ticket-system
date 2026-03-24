import { io, Socket } from "socket.io-client";
import { authStorage } from "./auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001/realtime";

let socketInstance: Socket | null = null;

export function getSocket() {
  if (socketInstance) return socketInstance;
  socketInstance = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
  });
  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  socket.auth = { token: authStorage.getToken() };
  if (!socket.connected) socket.connect();
  return socket;
}
