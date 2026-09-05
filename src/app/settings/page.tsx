"use client";

import { Button, Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: { login: string; name: string } | null }>("/api/auth/me"),
  });

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <Screen>
      <TopBar title="Settings" onBack={() => router.push("/dashboard")} />
      <div className="rounded-[32px] border border-line bg-white/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Current login
        </p>
        <p className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl">
          {data?.user?.login}
        </p>
        <div className="mt-8 grid gap-3">
          <Button variant="secondary" onClick={() => router.push("/history")}>
            Change history
          </Button>
          <Button variant="secondary" onClick={() => router.push("/archive")}>
            Archive
          </Button>
          <Button variant="danger" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </Screen>
  );
}
