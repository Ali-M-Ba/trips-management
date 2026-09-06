"use client";

import { Button, Input, Screen } from "@/components/ui";
import { api } from "@/lib/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api(registering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(
          registering ? { name, login, password } : { login, password },
        ),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WRONG LOGIN OR PASSWORD");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen className="flex min-h-screen items-center">
      <form
        onSubmit={onSubmit}
        className="mx-auto w-full max-w-md rounded-[32px] border border-line bg-white/70 p-6 shadow-[var(--shadow)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brass-deep">
          Staff desk
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl">
          {registering ? "Create account" : "Sign in"}
        </h1>
        {registering ? (
          <label className="mt-8 block text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Name
            <Input
              className="mt-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="mt-8 block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Login
          <Input
            className="mt-2"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="mt-5 block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Password
          <Input
            className="mt-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={registering ? "new-password" : "current-password"}
            required
          />
        </label>
        {error ? (
          <p className="mt-4 rounded-2xl bg-seat-taken/10 px-4 py-3 text-sm font-semibold text-seat-taken">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Working..." : registering ? "Create account" : "Sign in"}
        </Button>
        <button
          type="button"
          className="mt-4 w-full text-sm font-semibold text-brass-deep underline-offset-4 hover:underline"
          onClick={() => {
            setRegistering((value) => !value);
            setError("");
          }}
        >
          {registering
            ? "Already have an account? Sign in"
            : "Create a new account"}
        </button>
      </form>
    </Screen>
  );
}
