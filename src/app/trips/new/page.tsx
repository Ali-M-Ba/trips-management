"use client";

import { Button, Input, Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import { TRIP_STATUSES, type TripStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dateText, setDateText] = useState("");
  const [status, setStatus] = useState<TripStatus | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    setError("");
    try {
      const data = await api<{ trip: { _id: string } }>("/api/trips", {
        method: "POST",
        body: JSON.stringify({ name, dateText, status }),
      });
      router.push(`/trips/created/${data.trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create trip");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <TopBar title="CREATE A TRIP!" onBack={() => router.push("/dashboard")} />
      <div className="mx-auto max-w-xl space-y-5 rounded-[32px] border border-line bg-white/70 p-6">
        <label className="block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Trip name
          <Input
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Lithuania → Latvia"
          />
        </label>
        <label className="block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Date
          <Input
            className="mt-2"
            value={dateText}
            onChange={(event) => setDateText(event.target.value)}
            placeholder="October 17–19"
          />
        </label>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Trip status
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TRIP_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(status === option ? null : option)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-wide",
                  status === option
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white/80 text-ink",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm font-semibold text-seat-taken">{error}</p> : null}
        <Button className="w-full" onClick={create} disabled={pending}>
          Create
        </Button>
      </div>
    </Screen>
  );
}
