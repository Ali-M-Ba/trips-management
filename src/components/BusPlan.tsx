import { isSeatOccupied } from "@/lib/seats";
import type { Group, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const ROWS = Array.from({ length: 13 }, (_, row) => {
  const start = row * 4 + 1;
  return {
    left: [start, start + 1],
    right: [start + 2, start + 3],
  };
});

export function BusPlan({
  seats,
  groups,
  selected,
  selectionMode,
  onSeatClick,
  onSeatLongPress,
}: {
  seats: Seat[];
  groups: Group[];
  selected: number[];
  selectionMode: boolean;
  onSeatClick: (seatNumber: number) => void;
  onSeatLongPress: (seatNumber: number) => void;
}) {
  const groupName = (id: string | null) =>
    groups.find((group) => group._id === id)?.name ?? "";

  return (
    <div className="mx-auto w-full max-w-xl rounded-[36px] border border-line bg-[#2a241c] p-4 text-paper shadow-[var(--shadow)]">
      <div className="mb-4 flex items-center justify-between rounded-[28px] bg-[#3a3228] px-4 py-3">
        <div className="rounded-2xl bg-[#1d1813] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#e8c37a]">
          Driver
        </div>
        <div className="h-10 w-16 rounded-full border-2 border-dashed border-[#e8c37a]/50" />
        <div className="rounded-2xl bg-[#1d1813] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#d3c6b0]">
          Door
        </div>
      </div>
      <div className="space-y-2">
        {ROWS.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_42px_1fr] items-center gap-2">
            <div className="grid grid-cols-2 gap-2">
              {row.left.map((seatNumber) => (
                <SeatButton
                  key={seatNumber}
                  seat={seats.find((item) => item.seatNumber === seatNumber)!}
                  groupLabel={groupName(
                    seats.find((item) => item.seatNumber === seatNumber)?.groupId ?? null,
                  )}
                  selected={selected.includes(seatNumber)}
                  selectionMode={selectionMode}
                  onClick={() => onSeatClick(seatNumber)}
                  onLongPress={() => onSeatLongPress(seatNumber)}
                />
              ))}
            </div>
            <div className="h-full rounded-full bg-[#4a4034]" />
            <div className="grid grid-cols-2 gap-2">
              {row.right.map((seatNumber) => (
                <SeatButton
                  key={seatNumber}
                  seat={seats.find((item) => item.seatNumber === seatNumber)!}
                  groupLabel={groupName(
                    seats.find((item) => item.seatNumber === seatNumber)?.groupId ?? null,
                  )}
                  selected={selected.includes(seatNumber)}
                  selectionMode={selectionMode}
                  onClick={() => onSeatClick(seatNumber)}
                  onLongPress={() => onSeatLongPress(seatNumber)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  groupLabel,
  selected,
  selectionMode,
  onClick,
  onLongPress,
}: {
  seat: Seat;
  groupLabel: string;
  selected: boolean;
  selectionMode: boolean;
  onClick: () => void;
  onLongPress: () => void;
}) {
  const timer = useRef<number | null>(null);
  const occupied = isSeatOccupied(seat);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      onPointerDown={() => {
        timer.current = window.setTimeout(() => {
          timer.current = null;
          onLongPress();
        }, 450);
      }}
      onPointerUp={() => {
        if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
          onClick();
        }
      }}
      onPointerLeave={() => {
        if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "relative aspect-square rounded-2xl text-white shadow-inner transition active:scale-95",
        occupied ? "bg-seat-taken" : "bg-seat-free",
        selected && "ring-4 ring-[#e8c37a]",
      )}
    >
      {selectionMode ? (
        <span
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full border-2 border-white",
            selected ? "bg-[#e8c37a]" : "bg-transparent",
          )}
        />
      ) : null}
      <span className="block text-sm font-bold">{seat.seatNumber}</span>
      {groupLabel ? (
        <span className="mt-0.5 block truncate px-1 text-[10px] uppercase tracking-wide opacity-90">
          {groupLabel}
        </span>
      ) : seat.passengerName ? (
        <span className="mt-0.5 block truncate px-1 text-[10px] opacity-90">
          {seat.passengerName}
        </span>
      ) : null}
    </button>
  );
}
