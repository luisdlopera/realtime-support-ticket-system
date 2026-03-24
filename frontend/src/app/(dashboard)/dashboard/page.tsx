"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/hooks/useSocket";
import { DashboardMetrics } from "@/types";
import { MetricCard } from "@/components/metrics/metric-card";

export default function DashboardPage() {
  const socket = useSocket();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    unassigned: 0,
  });

  useEffect(() => {
    async function loadMetrics() {
      const data = await api.dashboardMetrics();
      setMetrics(data as DashboardMetrics);
    }

    void loadMetrics();
    const refresh = () => void loadMetrics();
    socket.on("ticket.created", refresh);
    socket.on("ticket.assigned", refresh);
    socket.on("ticket.status.changed", refresh);
    return () => {
      socket.off("ticket.created", refresh);
      socket.off("ticket.assigned", refresh);
      socket.off("ticket.status.changed", refresh);
    };
  }, [socket]);

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Live metrics</h2>
      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Open" value={metrics.open} />
        <MetricCard label="In progress" value={metrics.inProgress} />
        <MetricCard label="Resolved" value={metrics.resolved} />
        <MetricCard label="Closed" value={metrics.closed} />
        <MetricCard label="Unassigned" value={metrics.unassigned} />
      </section>
    </main>
  );
}
