"use client";

import { Button, Screen, StatCard } from "@/components/ui";
import { api } from "@/lib/client";
import { SEAT_COUNT } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

type Dashboard = {
  user: { login: string; name: string };
  stats: { plannedTrips: number; occupiedSeats: number; unpaidSeats: number };
  trips: {
    _id: string;
    name: string;
    dateText: string;
    status: string | null;
    occupiedSeats: number;
    freeSeats: number;
  }[];
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
        <StatCard
          label="Occupied seats"
          value={data?.stats.occupiedSeats ?? 0}
        />
        <StatCard label="Unpaid seats" value={data?.stats.unpaidSeats ?? 0} />
      </div>

      <Button
        className="mt-6 w-full py-4"
        onClick={() => router.push("/trips/new")}
      >
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.trips.map((trip) => (
              <button
                key={trip._id}
                type="button"
                onClick={() => router.push(`/trips/${trip._id}`)}
                className="group relative min-h-64 overflow-hidden rounded-[28px] border border-line bg-white/80 p-5 text-left shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(20,32,51,0.17)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-paper-deep px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brass-deep">
                    {trip.status || "Draft"}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brass-deep" />
                </div>
                <p className="mt-6 line-clamp-2 font-[family-name:var(--font-fraunces)] text-2xl leading-tight">
                  {trip.name || "Untitled trip"}
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <CalendarDays className="h-4 w-4 text-brass-deep" />
                  {trip.dateText || "Date not set"}
                </p>
                <div className="mt-7">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
                    <span>Seats booked</span>
                    <span>
                      {trip.occupiedSeats}/{SEAT_COUNT}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-seat-free transition-all"
                      style={{
                        width: `${Math.min(100, (trip.occupiedSeats / SEAT_COUNT) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink-soft">
                    {trip.freeSeats} seats still available
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
