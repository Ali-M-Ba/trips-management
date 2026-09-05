"use client";

import { Button, Modal, Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/client";
import type { Trip } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ArchivePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{ id: string; mode: "restore" | "delete" } | null>(
    null,
  );

  const { data } = useQuery({
    queryKey: ["archive"],
    queryFn: () => api<{ trips: Trip[] }>("/api/archive"),
  });

  const restore = useMutation({
    mutationFn: (id: string) => api(`/api/trips/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setConfirm(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/trips/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
      setConfirm(null);
    },
  });

  return (
    <Screen>
      <TopBar title="Archive of trips" onBack={() => router.push("/settings")} />
      <div className="space-y-3">
        {data?.trips.length ? (
          data.trips.map((trip) => (
            <div
              key={trip._id}
              className="rounded-[28px] border border-line bg-white/80 p-5"
            >
              <p className="font-[family-name:var(--font-fraunces)] text-2xl">
                {trip.name || "Untitled trip"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{trip.dateText || "No date"}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirm({ id: trip._id, mode: "restore" })}
                >
                  Restore
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirm({ id: trip._id, mode: "delete" })}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
            Archive is empty.
          </p>
        )}
      </div>

      <Modal
        open={Boolean(confirm)}
        title={confirm?.mode === "delete" ? "Delete permanently?" : "Restore trip?"}
        onClose={() => setConfirm(null)}
      >
        <p className="text-ink-soft">
          {confirm?.mode === "delete"
            ? "This cannot be undone."
            : "The trip will return to the dashboard list."}
        </p>
        <Button
          className="mt-4 w-full"
          variant={confirm?.mode === "delete" ? "danger" : "primary"}
          onClick={() => {
            if (!confirm) return;
            if (confirm.mode === "delete") remove.mutate(confirm.id);
            else restore.mutate(confirm.id);
          }}
        >
          Confirm
        </Button>
      </Modal>
    </Screen>
  );
}
