"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@heroui/react";
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/linea-soporte", label: "Línea de soporte", icon: MessageSquare },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check localStorage for collapsed state
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
    }
  }, [isCollapsed, isMounted]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-1 flex-col lg:ml-64">
          <main className="flex-1 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Headphones size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold">Support Console</h1>
          </Link>
          <Button
            isIconOnly
            variant="light"
            radius="full"
            size="sm"
            onPress={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Tema</span>
            <ThemeToggle />
          </div>
          <Button
            fullWidth
            variant="flat"
            color="danger"
            size="sm"
            startContent={<LogOut size={16} />}
            onPress={() => {
              authStorage.clear();
              localStorage.removeItem("support_user");
              router.push("/login");
            }}
            className="font-medium"
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Desktop Sidebar - Collapsible */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-zinc-200 bg-white shadow-sm transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 lg:flex ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        aria-label="Desktop navigation"
      >
        {/* Header */}
        <div
          className={`flex h-16 items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}
        >
          <Link
            href="/dashboard"
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2"}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
              <Headphones size={18} className="text-white" />
            </div>
            {!isCollapsed && <h1 className="text-lg font-bold truncate">Support</h1>}
          </Link>
          {!isCollapsed && (
            <Button
              isIconOnly
              variant="light"
              radius="full"
              size="sm"
              onPress={() => setIsCollapsed(true)}
              aria-label="Colapsar menú"
              className="text-zinc-500"
            >
              <ChevronLeft size={18} />
            </Button>
          )}
        </div>

        {/* Collapse button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center py-2">
            <Button
              isIconOnly
              variant="light"
              radius="full"
              size="sm"
              onPress={() => setIsCollapsed(false)}
              aria-label="Expandir menú"
              className="text-zinc-500"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                } ${isCollapsed ? "justify-center" : ""}`}
                aria-current={active ? "page" : undefined}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={`border-t border-zinc-200 p-3 dark:border-zinc-800 ${isCollapsed ? "flex flex-col items-center gap-3" : ""}`}
        >
          {isCollapsed ? (
            <>
              <ThemeToggle />
              <Button
                isIconOnly
                variant="flat"
                color="danger"
                size="sm"
                onPress={() => {
                  authStorage.clear();
                  localStorage.removeItem("support_user");
                  router.push("/login");
                }}
                aria-label="Cerrar sesión"
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Tema</span>
                <ThemeToggle />
              </div>
              <Button
                fullWidth
                variant="flat"
                color="danger"
                size="sm"
                startContent={<LogOut size={16} />}
                onPress={() => {
                  authStorage.clear();
                  localStorage.removeItem("support_user");
                  router.push("/login");
                }}
                className="font-medium"
              >
                Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex min-h-screen w-full flex-col transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-zinc-200 bg-white/80 px-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 lg:hidden">
          <Button
            isIconOnly
            variant="light"
            radius="full"
            size="sm"
            onPress={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </Button>
          <Link href="/dashboard" className="ml-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Headphones size={16} className="text-white" />
            </div>
            <span className="text-base font-bold">Support</span>
          </Link>
        </header>

        {/* Desktop Header with collapse toggle */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {pathname === "/dashboard" && "Dashboard"}
              {pathname === "/tickets" && "Tickets"}
              {pathname.startsWith("/tickets/") && "Detalle del Ticket"}
              {pathname === "/linea-soporte" && "Línea de Soporte"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Agente</span>
            <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-medium text-white">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
