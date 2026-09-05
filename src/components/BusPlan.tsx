import { isSeatOccupied } from "@/lib/seats";
import type { Group, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

type GroupColor = {
  background: string;
  border: string;
  foreground: string;
};

const GROUP_COLORS: GroupColor[] = [
  { background: "#7c3aed", border: "#c4b5fd", foreground: "#ffffff" },
  { background: "#0f766e", border: "#99f6e4", foreground: "#ffffff" },
  { background: "#b45309", border: "#fcd34d", foreground: "#ffffff" },
  { background: "#be123c", border: "#fda4af", foreground: "#ffffff" },
  { background: "#1d4ed8", border: "#bfdbfe", foreground: "#ffffff" },
  { background: "#047857", border: "#a7f3d0", foreground: "#ffffff" },
  { background: "#a21caf", border: "#f0abfc", foreground: "#ffffff" },
  { background: "#c2410c", border: "#fed7aa", foreground: "#ffffff" },
];

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
  const seatsByNumber = new Map(seats.map((seat) => [seat.seatNumber, seat]));
  const groupLabels = new Map(groups.map((group) => [group._id, group.name]));
  const groupIds = [
    ...new Set([
      ...groups.map((group) => group._id),
      ...seats
        .map((seat) => seat.groupId)
        .filter((groupId): groupId is string => Boolean(groupId)),
    ]),
  ].sort((first, second) => first.localeCompare(second));
  const groupColors = new Map(
    groupIds.map((groupId, index) => [
      groupId,
      GROUP_COLORS[index % GROUP_COLORS.length],
    ]),
  );

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
              {row.left.map((seatNumber) => {
                const seat = seatsByNumber.get(seatNumber)!;

                return (
                  <SeatButton
                    key={seatNumber}
                    seat={seat}
                    groupLabel={seat.groupId ? groupLabels.get(seat.groupId) ?? "Group" : ""}
                    groupColor={seat.groupId ? groupColors.get(seat.groupId) ?? GROUP_COLORS[0] : null}
                    selected={selected.includes(seatNumber)}
                    selectionMode={selectionMode}
                    onClick={() => onSeatClick(seatNumber)}
                    onLongPress={() => onSeatLongPress(seatNumber)}
                  />
                );
              })}
            </div>
            <div className="h-full rounded-full bg-[#4a4034]" />
            <div className="grid grid-cols-2 gap-2">
              {row.right.map((seatNumber) => {
                const seat = seatsByNumber.get(seatNumber)!;

                return (
                  <SeatButton
                    key={seatNumber}
                    seat={seat}
                    groupLabel={seat.groupId ? groupLabels.get(seat.groupId) ?? "Group" : ""}
                    groupColor={seat.groupId ? groupColors.get(seat.groupId) ?? GROUP_COLORS[0] : null}
                    selected={selected.includes(seatNumber)}
                    selectionMode={selectionMode}
                    onClick={() => onSeatClick(seatNumber)}
                    onLongPress={() => onSeatLongPress(seatNumber)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {groupIds.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {groupIds.map((groupId) => {
              const color = groupColors.get(groupId) ?? GROUP_COLORS[0];

              return (
                <div key={groupId} className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color.background }}
                  />
                  <span className="truncate text-[#d3c6b0]">
                    {groupLabels.get(groupId) ?? "Group"}
                  </span>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}

function SeatButton({
  seat,
  groupLabel,
  groupColor,
  selected,
  selectionMode,
  onClick,
  onLongPress,
}: {
  seat: Seat;
  groupLabel: string;
  groupColor: GroupColor | null;
  selected: boolean;
  selectionMode: boolean;
  onClick: () => void;
  onLongPress: () => void;
}) {
  const timer = useRef<number | null>(null);
  const occupied = isSeatOccupied(seat);
  const paymentLabel = seat.paymentStatus ?? "UNPAID";
  const hasPassenger = Boolean(seat.passengerName.trim());
  const hasNote = Boolean(seat.paymentNote.trim());
  const groupStyle: CSSProperties | undefined = groupColor
    ? {
        backgroundColor: groupColor.background,
        borderColor: groupColor.border,
        color: groupColor.foreground,
      }
    : undefined;

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
        "relative aspect-square rounded-2xl border-2 border-transparent text-white shadow-inner transition active:scale-95",
        groupColor ? "" : occupied ? "bg-seat-taken" : "bg-seat-free",
        selected && "ring-4 ring-[#e8c37a]",
      )}
      style={groupStyle}
    >
      {selectionMode ? (
        <span
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full border-2 border-white",
            selected ? "bg-[#e8c37a]" : "bg-transparent",
          )}
        />
      ) : null}
      <span className="absolute left-2 top-1.5 text-sm font-bold leading-none">
        {seat.seatNumber}
      </span>
      {occupied ? (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-bold leading-none">
          {paymentLabel}
        </span>
      ) : null}
      <span className="flex h-full flex-col justify-end gap-0.5 px-1.5 pb-1.5 pt-6 text-left">
        {groupLabel ? (
          <span className="truncate text-[10px] font-bold uppercase leading-tight opacity-95">
            {groupLabel}
          </span>
        ) : null}
        {hasPassenger ? (
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
            {seat.passengerName}
          </span>
        ) : occupied ? (
          <span className="truncate text-[10px] font-semibold leading-tight opacity-85">
            Held seat
          </span>
        ) : (
          <span className="truncate text-[10px] font-semibold leading-tight opacity-85">
            Free
          </span>
        )}
        {hasNote ? (
          <span className="truncate text-[9px] leading-tight opacity-85">
            {seat.paymentNote}
          </span>
        ) : null}
      </span>
    </button>
  );
}
