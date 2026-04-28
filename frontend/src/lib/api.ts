import { authStorage } from "./auth";
import { TicketMessage, WhatsappInboxRow } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    authStorage.setToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const makeRequest = async (accessToken: string | null): Promise<Response> => {
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      cache: "no-store",
    });
  };

  const token = authStorage.getToken();
  let response = await makeRequest(token);

  // Si el token expiró (401), intentar refresh
  if (response.status === 401 && !path.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        notifyRefreshSubscribers(newToken);
        response = await makeRequest(newToken);
      } else {
        // Refresh falló, redirigir a login
        authStorage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // Esperar a que termine el refresh en curso
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newToken) => {
          makeRequest(newToken)
            .then(async (newResponse) => {
              if (!newResponse.ok) {
                const payload = await newResponse.text();
                reject(new Error(payload || "Request failed"));
                return;
              }
              if (newResponse.status === 204) {
                resolve({} as T);
                return;
              }
              resolve(newResponse.json() as Promise<T>);
            })
            .catch(reject);
        });
      });
    }
  }

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

function authHeader(): Record<string, string> {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  login: async (body: { email: string; password: string }) => {
    const result = await request<{
      accessToken: string;
      user: { id: string; name: string; email: string; role: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    // Guardar el access token en memoria
    authStorage.setToken(result.accessToken);
    return result;
  },

  logout: async () => {
    await request("/auth/logout", {
      method: "POST",
    });
    authStorage.clear();
  },

  forgotPassword: (body: { email: string }) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: { name: string; email: string; password: string; role?: string }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listTickets: () => request("/tickets"),
  getTicket: (ticketId: string) => request(`/tickets/${ticketId}`),
  createTicket: (body: { title: string; description: string }) =>
    request("/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  assignTicket: (ticketId: string, assigneeId: string) =>
    request(`/tickets/${ticketId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    }),
  changeTicketStatus: (ticketId: string, status: string) =>
    request(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  listMessages: (ticketId: string) => request<TicketMessage[]>(`/tickets/${ticketId}/messages`),

  createMessage: (ticketId: string, text: string) =>
    request<TicketMessage>(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  postMessage: (ticketId: string, body: { text?: string; replyToMessageId?: string }) =>
    request<TicketMessage>(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createMessageWithMedia: (
    ticketId: string,
    form: { text?: string; replyToMessageId?: string; file?: File | null },
  ) => {
    const fd = new FormData();
    if (form.text) fd.append("text", form.text);
    if (form.replyToMessageId) fd.append("replyToMessageId", form.replyToMessageId);
    if (form.file) fd.append("file", form.file);
    return fetch(`${API_URL}/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: authHeader(),
      body: fd,
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || "Request failed");
      }
      return response.json() as Promise<TicketMessage>;
    });
  },

  markMessagesRead: (ticketId: string) =>
    request(`/tickets/${ticketId}/messages/mark-read`, { method: "POST" }),

  getMessageMediaInfo: (ticketId: string, messageId: string) =>
    request<{ url: string; mimeType: string | null; fileName: string | null }>(
      `/tickets/${ticketId}/messages/${messageId}/media`,
    ),

  listWhatsappInbox: (query?: { from?: string; to?: string; search?: string; status?: string }) => {
    const p = new URLSearchParams();
    if (query?.from) p.set("from", query.from);
    if (query?.to) p.set("to", query.to);
    if (query?.search) p.set("search", query.search);
    if (query?.status) p.set("status", query.status);
    const q = p.toString();
    return request<WhatsappInboxRow[]>(`/tickets/inbox/whatsapp${q ? `?${q}` : ""}`);
  },

  dashboardMetrics: () => request("/tickets/metrics/dashboard"),
};
