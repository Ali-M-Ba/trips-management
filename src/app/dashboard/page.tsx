"use client";

import { Button, Screen, StatCard } from "@/components/ui";
import { api } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

type Dashboard = {
  user: { login: string; name: string };
  stats: { plannedTrips: number; occupiedSeats: number; unpaidSeats: number };
  trips: { _id: string; name: string; dateText: string; freeSeats: number }[];
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dashboard>("/api/dashboard"),
  });

  return (
    <Screen>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brass-deep">
            {data?.user.login}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-fraunces)] text-4xl">
            {greeting()}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Planned trips" value={data?.stats.plannedTrips ?? 0} />
        <StatCard label="Occupied seats" value={data?.stats.occupiedSeats ?? 0} />
        <StatCard label="Unpaid seats" value={data?.stats.unpaidSeats ?? 0} />
      </div>

      <Button className="mt-6 w-full py-4" onClick={() => router.push("/trips/new")}>
        Create trip
      </Button>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-ink-soft">Loading trips...</p>
        ) : !data?.trips.length ? (
          <p className="rounded-3xl border border-dashed border-line px-6 py-16 text-center text-lg font-semibold tracking-wide">
            NO TRIPS AVAILABLE
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {data.trips.map((trip) => (
              <button
                key={trip._id}
                type="button"
                onClick={() => router.push(`/trips/${trip._id}`)}
                className="aspect-square rounded-[28px] border border-line bg-white/80 p-4 text-left shadow-[var(--shadow)] transition hover:-translate-y-0.5"
              >
                <p className="font-[family-name:var(--font-fraunces)] text-xl leading-tight">
                  {trip.name || "Untitled trip"}
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                  {trip.freeSeats} free seats
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
