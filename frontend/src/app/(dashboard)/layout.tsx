"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return <DashboardShell>{children}</DashboardShell>;
}
