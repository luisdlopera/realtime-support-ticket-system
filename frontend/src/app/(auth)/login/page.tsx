"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { Input, Button, Card, CardHeader, CardBody } from "@heroui/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("agent@support.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ email, password });
      authStorage.setToken(response.accessToken);
      localStorage.setItem("support_user", JSON.stringify(response.user));
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full p-2">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">Bienvenido</h1>
          <p className="text-sm text-zinc-500">
            Demo users: agent@support.local / customer@support.local
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              variant="bordered"
              value={email}
              onValueChange={setEmail}
              isRequired
            />

            <Input
              label="Contraseña"
              variant="bordered"
              type="password"
              value={password}
              onValueChange={setPassword}
              isRequired
            />

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button
              type="submit"
              color="primary"
              className="w-full font-bold"
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
