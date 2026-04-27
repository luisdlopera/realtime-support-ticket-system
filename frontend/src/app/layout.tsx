import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Realtime Support Ticket System",
  description: "Portfolio project with Next.js + NestJS + Redis + WebSockets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
