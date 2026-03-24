import { authStorage } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Request failed");
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ accessToken: string; user: { id: string; name: string; email: string; role: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
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
  listMessages: (ticketId: string) => request(`/tickets/${ticketId}/messages`),
  createMessage: (ticketId: string, content: string) =>
    request(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  dashboardMetrics: () => request("/tickets/metrics/dashboard"),
};
