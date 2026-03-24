"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";

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
      <form onSubmit={onSubmit} className="card w-full space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-300">Demo users: agent@support.local / customer@support.local</p>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Email</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Password</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
