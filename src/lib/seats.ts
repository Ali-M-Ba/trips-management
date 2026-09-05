import { SEAT_COUNT, type Seat, type TripStats } from "@/lib/types";

export function createEmptySeats(): Seat[] {
  return Array.from({ length: SEAT_COUNT }, (_, index) => ({
    seatNumber: index + 1,
    passengerName: "",
    paymentStatus: null,
    paymentNote: "",
    groupId: null,
  }));
}

export function isSeatOccupied(seat: Seat) {
  return Boolean(
    seat.passengerName.trim() ||
      seat.paymentNote.trim() ||
      seat.groupId ||
      seat.paymentStatus,
  );
}

export function tripStats(seats: Seat[]): TripStats {
  const occupiedSeats = seats.filter(isSeatOccupied);
  const occupied = occupiedSeats.length;
  const paid = occupiedSeats.filter((seat) => seat.paymentStatus === "PAID").length;
  return {
    total: seats.length,
    occupied,
    free: seats.length - occupied,
    paid,
    unpaid: occupied - paid,
  };
}

export function serializeSeat(seat: {
  seatNumber: number;
  passengerName?: string;
  paymentStatus?: string | null;
  paymentNote?: string;
  groupId?: unknown;
}): Seat {
  return {
    seatNumber: seat.seatNumber,
    passengerName: seat.passengerName ?? "",
    paymentStatus:
      seat.paymentStatus === "PAID" || seat.paymentStatus === "UNPAID"
        ? seat.paymentStatus
        : null,
    paymentNote: seat.paymentNote ?? "",
    groupId: seat.groupId ? String(seat.groupId) : null,
  };
}
