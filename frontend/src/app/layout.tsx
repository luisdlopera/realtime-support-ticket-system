import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Realtime Support Ticket System",
  description: "Portfolio project with Next.js + NestJS + Redis + WebSockets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
