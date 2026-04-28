"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Input, Button, Card, CardHeader, CardBody } from "@heroui/react";
import { Headphones, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("agent@support.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login({ email, password });
      // Redirigir a la URL original o al dashboard
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(52,61,203,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(0,168,132,0.16),_transparent_30%)]" />
      <Card className="w-full max-w-md border border-zinc-200/70 p-2 shadow-2xl shadow-zinc-900/10 dark:border-zinc-700/70 dark:bg-content1 dark:shadow-black/20">
        <CardHeader className="flex flex-col items-start gap-4 px-5 pb-2 pt-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
            <Headphones size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ingresa a la consola para gestionar tickets en tiempo real.
            </p>
          </div>
          <p className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-content2 dark:text-zinc-300">
            Demo: agent@support.local / customer@support.local
          </p>
        </CardHeader>
        <CardBody className="px-5 pb-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onValueChange={setEmail}
              startContent={<Mail size={16} className="text-zinc-400" />}
              autoComplete="email"
              isRequired
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onValueChange={setPassword}
              startContent={<Lock size={16} className="text-zinc-400" />}
              autoComplete="current-password"
              isRequired
            />

            {error ? (
              <div className="rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/30 dark:text-danger-300">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              color="primary"
              className="w-full font-bold shadow-lg shadow-primary/20"
              isLoading={loading}
              size="lg"
            >
              Iniciar sesión
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
