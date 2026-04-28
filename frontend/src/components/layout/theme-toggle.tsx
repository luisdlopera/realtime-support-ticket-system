"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <span
        className="h-8 w-16 rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-600/70 dark:bg-content2"
        aria-hidden
      />
    );
  }
  const isDark = (resolvedTheme ?? theme) === "dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-zinc-600/70 dark:bg-content2 dark:text-zinc-300 dark:hover:border-zinc-500/80 dark:hover:bg-content3"
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        aria-pressed={isDark}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative inline-flex h-8 w-16 items-center rounded-full border border-zinc-200 bg-zinc-100 p-1 text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-zinc-600/70 dark:bg-content2 dark:text-zinc-300 dark:hover:border-zinc-500/80 dark:hover:bg-content3"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
    >
      <span className="absolute left-2 text-amber-500">
        <Sun size={14} />
      </span>
      <span className="absolute right-2 text-indigo-300">
        <Moon size={14} />
      </span>
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow transition-transform duration-200 dark:bg-content4 dark:text-zinc-100 ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
        aria-hidden
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  );
}
