"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <span
        className="h-8 w-20 rounded-md border border-zinc-300 dark:border-zinc-600"
        aria-hidden
      />
    );
  }
  const isDark = (resolvedTheme ?? theme) === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800"
    >
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
