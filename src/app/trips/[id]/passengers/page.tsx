"use client";

import { Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import { isSeatOccupied } from "@/lib/seats";
import type { TripWithGroups } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

export default function PassengersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ["trip", params.id],
    queryFn: () => api<{ trip: TripWithGroups }>(`/api/trips/${params.id}`),
  });

  const passengers = (data?.trip.seats ?? []).filter(
    (seat) => isSeatOccupied(seat) && seat.passengerName.trim(),
  );

  return (
    <Screen>
      <TopBar title="Passengers" onBack={() => router.push(`/trips/${params.id}`)} />
      <div className="overflow-hidden rounded-[28px] border border-line bg-white/80">
        {passengers.length ? (
          passengers.map((seat) => (
            <div
              key={seat.seatNumber}
              className="flex items-center justify-between border-b border-line px-5 py-4 last:border-b-0"
            >
              <div>
                <p className="font-semibold">{seat.passengerName}</p>
                <p className="text-sm text-ink-soft">Seat {seat.seatNumber}</p>
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide">
                {seat.paymentStatus ?? "UNPAID"}
              </p>
            </div>
          ))
        ) : (
          <p className="px-5 py-10 text-center text-ink-soft">No passengers yet.</p>
        )}
      </div>
    </Screen>
  );
}
