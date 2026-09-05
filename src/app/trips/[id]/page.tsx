"use client";

import { Button, Input, Modal, Screen, StatCard, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import { TRIP_STATUSES, type TripStatus, type TripWithGroups } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [dateText, setDateText] = useState("");
  const [status, setStatus] = useState<TripStatus | null>(null);
  const [editError, setEditError] = useState("");

  const { data } = useQuery({
    queryKey: ["trip", params.id],
    queryFn: () => api<{ trip: TripWithGroups & { stats: { occupied: number; paid: number; free: number; unpaid: number } } }>(`/api/trips/${params.id}`),
  });

  const trip = data?.trip;

  const updateTrip = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("Trip name is required");

      return api(`/api/trips/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, dateText, status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditOpen(false);
      setEditError("");
    },
    onError: (err) => {
      setEditError(err instanceof Error ? err.message : "Could not update trip");
    },
  });

  const archive = useMutation({
    mutationFn: () =>
      api(`/api/trips/${params.id}/archive`, { method: "POST" }),
    onSuccess: () => router.push("/dashboard"),
  });

  return (
    <Screen>
      <TopBar
        title={trip ? `${trip.name || "Untitled trip"}` : "Trip"}
        onBack={() => router.push("/dashboard")}
        actions={
          <Button variant="secondary" className="px-3" onClick={() => setMenuOpen(true)}>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>{trip?.dateText || "No date"}</span>
        {trip?.status ? (
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 font-semibold uppercase tracking-wide text-ink">
            {trip.status}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Occupied" value={trip?.stats.occupied ?? 0} />
        <StatCard label="Paid" value={trip?.stats.paid ?? 0} />
        <StatCard label="Free" value={trip?.stats.free ?? 0} />
        <StatCard label="Unpaid" value={trip?.stats.unpaid ?? 0} />
      </div>

      <div className="mt-6 grid gap-3">
        <Button onClick={() => router.push(`/trips/${params.id}/bus-plan`)}>
          Bus plan
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/trips/${params.id}/passengers`)}
        >
          Passengers
        </Button>
      </div>

      <Modal open={menuOpen} title="Trip actions" onClose={() => setMenuOpen(false)}>
        <div className="grid gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setName(trip?.name ?? "");
              setDateText(trip?.dateText ?? "");
              setStatus(trip?.status ?? null);
              setEditError("");
              setMenuOpen(false);
              setEditOpen(true);
            }}
          >
            Edit trip
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Modal open={editOpen} title="Edit trip" onClose={() => setEditOpen(false)}>
        <label className="block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Trip name
          <Input
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Date
          <Input
            className="mt-2"
            value={dateText}
            onChange={(event) => setDateText(event.target.value)}
            placeholder="October 17-19"
          />
        </label>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Trip status
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
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
        {editError ? (
          <p className="mt-4 text-sm font-semibold text-seat-taken">{editError}</p>
        ) : null}
        <Button
          className="mt-4 w-full"
          onClick={() => updateTrip.mutate()}
          disabled={updateTrip.isPending || !name.trim()}
        >
          Save
        </Button>
      </Modal>

      <Modal open={deleteOpen} title="Move to archive?" onClose={() => setDeleteOpen(false)}>
        <p className="text-ink-soft">
          This trip will leave the list and appear in Archive, where it can be restored or
          permanently deleted.
        </p>
        <Button className="mt-4 w-full" variant="danger" onClick={() => archive.mutate()}>
          Confirm delete
        </Button>
      </Modal>
    </Screen>
  );
}
