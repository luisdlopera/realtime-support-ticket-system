"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/hooks/useSocket";
import { DashboardMetrics } from "@/types";
import { MetricCard } from "@/components/metrics/metric-card";
import { MetricCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, TrendingUp, Clock, Users } from "lucide-react";

export default function DashboardPage() {
  const socket = useSocket();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api.dashboardMetrics();
        setMetrics(data as DashboardMetrics);
      } finally {
        setIsLoading(false);
      }
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
    <main className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold sm:text-xl">Dashboard</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Visión general del sistema en tiempo real
        </p>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <section className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton className="col-span-2 sm:col-span-1" />
        </section>
      ) : metrics ? (
        <section className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Abiertos" value={metrics.open} icon={Activity} color="blue" />
          <MetricCard label="En progreso" value={metrics.inProgress} icon={Clock} color="yellow" />
          <MetricCard label="Resueltos" value={metrics.resolved} icon={TrendingUp} color="green" />
          <MetricCard label="Cerrados" value={metrics.closed} icon={Activity} color="gray" />
          <MetricCard
            label="Sin asignar"
            value={metrics.unassigned}
            icon={Users}
            color="red"
            className="col-span-2 sm:col-span-1"
          />
        </section>
      ) : (
        <EmptyState type="tickets" description="No se pudieron cargar las métricas" />
      )}

      {/* Quick Stats or Chart Placeholder */}
      {!isLoading && metrics && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Actividad reciente
          </h3>
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              📊 Gráficos de análisis próximamente...
              <br />
              <span className="text-xs">
                Tickets por día, tiempo promedio de respuesta, satisfacción
              </span>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
