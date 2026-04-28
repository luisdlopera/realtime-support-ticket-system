import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(52,61,203,0.16),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(0,168,132,0.14),_transparent_30%)]" />
      <div className="rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-700/70 dark:bg-content1/80 dark:text-zinc-300">
        Consola de soporte en tiempo real
      </div>
      <div className="space-y-4">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl">
          Realtime Support Ticket System
        </h1>
        <p className="mx-auto max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
          Sistema de soporte en tiempo real con arquitectura hexagonal, NestJS, Redis Pub/Sub y
          Next.js.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-primary/30"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 bg-white/70 px-5 py-3 font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-zinc-700/70 dark:bg-content1/80 dark:text-zinc-100 dark:hover:bg-content2"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
