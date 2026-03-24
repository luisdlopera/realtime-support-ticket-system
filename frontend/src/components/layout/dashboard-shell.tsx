"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tickets", label: "Tickets" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Console</h1>
        <button
          onClick={() => {
            authStorage.clear();
            localStorage.removeItem("support_user");
            router.push("/login");
          }}
          className="rounded-md border border-gray-600 px-3 py-2 text-sm hover:bg-gray-800"
        >
          Logout
        </button>
      </header>
      <nav className="mb-6 flex gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-4 py-2 text-sm ${pathname === link.href ? "bg-indigo-600" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
