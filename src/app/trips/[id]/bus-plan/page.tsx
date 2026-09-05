"use client";

import { BusPlan } from "@/components/BusPlan";
import { Button, Input, Modal, Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import type { Group, PaymentStatus, Seat, TripWithGroups } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type TripPayload = {
  trip: TripWithGroups & {
    stats: { occupied: number; paid: number; free: number; unpaid: number };
  };
};

type Snapshot = { seats: Seat[]; groups: Group[] };

export default function BusPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [activeSeat, setActiveSeat] = useState<Seat | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPayment, setDraftPayment] = useState<PaymentStatus>("UNPAID");
  const [draftNote, setDraftNote] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [historyDepth, setHistoryDepth] = useState({ past: 0, future: 0 });
  const [seatError, setSeatError] = useState("");

  const { data } = useQuery({
    queryKey: ["trip", params.id],
    queryFn: () => api<TripPayload>(`/api/trips/${params.id}`),
  });

  const trip = data?.trip;
  const groupLookup = useMemo(
    () => new Map((trip?.groups ?? []).map((group) => [group._id, group.name])),
    [trip?.groups],
  );

  function snapshot(): Snapshot {
    return {
      seats: structuredClone(trip?.seats ?? []),
      groups: structuredClone(trip?.groups ?? []),
    };
  }

  function remember() {
    past.current.push(snapshot());
    future.current = [];
    setHistoryDepth({ past: past.current.length, future: future.current.length });
  }

  const saveSeat = useMutation({
    mutationFn: async () => {
      if (!activeSeat) return;
      const unchanged =
        draftName === activeSeat.passengerName &&
        draftNote === activeSeat.paymentNote &&
        (activeSeat.paymentStatus ?? "UNPAID") === draftPayment;
      if (unchanged) return;
      remember();
      return api(`/api/trips/${params.id}/seats/${activeSeat.seatNumber}`, {
        method: "PATCH",
        body: JSON.stringify({
          passengerName: draftName,
          paymentStatus: draftName.trim() || draftNote.trim() || activeSeat.groupId
            ? draftPayment
            : null,
          paymentNote: draftNote,
        }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const merge = useMutation({
    mutationFn: async () => {
      remember();
      return api(`/api/trips/${params.id}/groups`, {
        method: "POST",
        body: JSON.stringify({ name: groupName, seatNumbers: selected }),
      });
    },
    onSuccess: async () => {
      setMergeOpen(false);
      setSelectionMode(false);
      setSelected([]);
      setGroupName("");
      await queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
    },
  });

  const ungroup = useMutation({
    mutationFn: async (groupId: string) => {
      remember();
      return api(`/api/trips/${params.id}/groups/${groupId}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      setActiveSeat(null);
      setSeatError("");
      await queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      setSeatError(err instanceof Error ? err.message : "Could not ungroup seats");
    },
  });

  async function restore(target: Snapshot) {
    await api(`/api/trips/${params.id}/state`, {
      method: "POST",
      body: JSON.stringify(target),
    });
    await queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setHistoryDepth({ past: past.current.length, future: future.current.length });
  }

  async function undo() {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(snapshot());
    await restore(previous);
  }

  async function redo() {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(snapshot());
    await restore(next);
  }

  function openSeat(seatNumber: number) {
    if (selectionMode) {
      setSelected((current) =>
        current.includes(seatNumber)
          ? current.filter((item) => item !== seatNumber)
          : [...current, seatNumber],
      );
      return;
    }
    const seat = trip?.seats.find((item) => item.seatNumber === seatNumber);
    if (!seat) return;
    setSeatError("");
    setActiveSeat(seat);
    setDraftName(seat.passengerName);
    setDraftPayment(seat.paymentStatus ?? "UNPAID");
    setDraftNote(seat.paymentNote);
  }

  async function closeSeat() {
    if (ungroup.isPending) return;
    if (activeSeat) await saveSeat.mutateAsync();
    setActiveSeat(null);
  }

  async function ungroupActiveSeat() {
    const groupId = activeSeat?.groupId;
    if (!groupId) return;

    try {
      await saveSeat.mutateAsync();
      await ungroup.mutateAsync(groupId);
    } catch {
      // Mutation handlers render the useful message.
    }
  }

  return (
    <Screen>
      <TopBar
        title="Bus plan"
        onBack={() => router.push(`/trips/${params.id}`)}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" className="px-3" onClick={undo} disabled={!historyDepth.past}>
              Cancel
            </Button>
            <Button variant="secondary" className="px-3" onClick={redo} disabled={!historyDepth.future}>
              Forward
            </Button>
          </div>
        }
      />

      {selectionMode ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-3xl bg-white/70 p-3">
          <p className="text-sm font-semibold">{selected.length} seats selected</p>
          <Button onClick={() => setMergeOpen(true)} disabled={!selected.length}>
            Merge
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectionMode(false);
              setSelected([]);
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-ink-soft">
          Tap a seat to book. Long-press to group seats, even if they are not next to each other.
        </p>
      )}

      {trip ? (
        <BusPlan
          seats={trip.seats}
          groups={trip.groups}
          selected={selected}
          selectionMode={selectionMode}
          onSeatClick={openSeat}
          onSeatLongPress={(seatNumber) => {
            setSelectionMode(true);
            setSelected((current) =>
              current.includes(seatNumber) ? current : [...current, seatNumber],
            );
          }}
        />
      ) : (
        <p>Loading bus plan...</p>
      )}

      <Modal
        open={Boolean(activeSeat)}
        title={activeSeat ? `Seat ${activeSeat.seatNumber}` : "Seat"}
        onClose={() => void closeSeat()}
      >
        <label className="block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Name
          <Input
            className="mt-2"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Payment status
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["UNPAID", "PAID"] as PaymentStatus[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDraftPayment(option)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-semibold",
                draftPayment === option ? "border-ink bg-ink text-paper" : "border-line bg-white",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Payment note
          <Input
            className="mt-2"
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            placeholder="€150 cash / Will pay Friday"
          />
        </label>
        {activeSeat?.groupId ? (
          <p className="mt-3 text-sm text-ink-soft">
            Group: {groupLookup.get(activeSeat.groupId) || "Unnamed group"}
          </p>
        ) : null}
        {seatError ? (
          <p className="mt-4 text-sm font-semibold text-seat-taken">{seatError}</p>
        ) : null}
        {activeSeat?.groupId ? (
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() => void ungroupActiveSeat()}
            disabled={saveSeat.isPending || ungroup.isPending}
          >
            {ungroup.isPending ? "Ungrouping..." : "Ungroup"}
          </Button>
        ) : null}
      </Modal>

      <Modal open={mergeOpen} title="Group name" onClose={() => setMergeOpen(false)}>
        <Input
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="Smith Family"
        />
        <Button className="mt-4 w-full" onClick={() => merge.mutate()} disabled={!groupName.trim()}>
          Merge seats
        </Button>
      </Modal>
    </Screen>
  );
}
