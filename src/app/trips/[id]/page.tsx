"use client";

import { Button, Input, Modal, Screen, StatCard, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import type { TripWithGroups } from "@/lib/types";
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

  const { data } = useQuery({
    queryKey: ["trip", params.id],
    queryFn: () => api<{ trip: TripWithGroups & { stats: { occupied: number; paid: number; free: number; unpaid: number } } }>(`/api/trips/${params.id}`),
  });

  const trip = data?.trip;

  const rename = useMutation({
    mutationFn: () =>
      api(`/api/trips/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditOpen(false);
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
      <p className="mb-6 text-ink-soft">{trip?.dateText || "No date"}</p>

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
              setMenuOpen(false);
              setEditOpen(true);
            }}
          >
            Edit name
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

      <Modal open={editOpen} title="Edit name" onClose={() => setEditOpen(false)}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
        <Button className="mt-4 w-full" onClick={() => rename.mutate()}>
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
