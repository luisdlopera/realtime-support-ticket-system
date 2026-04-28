// Storage en memoria para el access token (NO usar localStorage por seguridad XSS)
let memoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    return memoryToken;
  },
  setToken(token: string) {
    memoryToken = token;
  },
  clear() {
    memoryToken = null;
  },
};

// Helper para verificar si estamos en el cliente
export function isClient(): boolean {
  return typeof window !== "undefined";
}
