import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-center text-4xl font-bold">Realtime Support Ticket System</h1>
      <p className="text-center text-gray-300">
        Sistema de soporte en tiempo real con arquitectura hexagonal, NestJS, Redis Pub/Sub y Next.js.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded-md bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
          Login
        </Link>
        <Link href="/dashboard" className="rounded-md border border-gray-600 px-4 py-2 font-medium hover:bg-gray-800">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
