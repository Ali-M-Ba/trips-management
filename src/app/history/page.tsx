"use client";

import { Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import type { HistoryEntry } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

function pretty(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function HistoryPage() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["history"],
    queryFn: () => api<{ entries: HistoryEntry[] }>("/api/history"),
  });

  return (
    <Screen>
      <TopBar title="Change history" onBack={() => router.push("/settings")} />
      <div className="space-y-3">
        {data?.entries.map((entry) => {
          const open = openId === entry._id;
          return (
            <button
              key={entry._id}
              type="button"
              onClick={() => setOpenId(open ? null : entry._id)}
              className="w-full rounded-[28px] border border-line bg-white/80 p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{entry.action}</p>
                <p className="text-sm text-ink-soft">
                  {entry.date} {entry.time}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{entry.tripName || "Trip"}</p>
              {open ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p>{entry.description}</p>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-ink-soft">
                      What it was
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-2xl bg-paper-deep p-3">
                      {pretty(entry.before)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-ink-soft">
                      What it became
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-2xl bg-paper-deep p-3">
                      {pretty(entry.after)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
        {!data?.entries.length ? (
          <p className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
            No changes recorded yet.
          </p>
        ) : null}
      </div>
    </Screen>
  );
}
