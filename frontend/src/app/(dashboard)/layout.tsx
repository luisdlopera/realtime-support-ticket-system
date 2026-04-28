import { DashboardShell } from "@/components/layout/dashboard-shell";

// El middleware de Next.js (middleware.ts) se encarga de la protección server-side
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
