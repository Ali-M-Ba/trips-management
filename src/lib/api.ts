import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { ensureSeedUser, getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";
import { Group } from "@/lib/models/Group";
import { serializeSeat, tripStats } from "@/lib/seats";
import { idString } from "@/lib/utils";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function withDb() {
  await connectDb();
  await ensureSeedUser();
}

export async function requireUser(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  await withDb();
  const user = await getSession();
  if (!user) return { response: jsonError("UNAUTHORIZED", 401) };
  return { user };
}

export function serializeTrip(trip: {
  _id: unknown;
  name?: string;
  dateText?: string;
  status?: string | null;
  isArchived?: boolean;
  seats?: Array<{
    seatNumber: number;
    passengerName?: string;
    paymentStatus?: string | null;
    paymentNote?: string;
    groupId?: unknown;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const seats = (trip.seats ?? []).map(serializeSeat);
  return {
    _id: idString(trip._id),
    name: trip.name ?? "",
    dateText: trip.dateText ?? "",
    status:
      trip.status === "PLANNED" ||
      trip.status === "PUBLISHED" ||
      trip.status === "COMPLETED"
        ? trip.status
        : null,
    isArchived: Boolean(trip.isArchived),
    seats,
    stats: tripStats(seats),
    createdAt: trip.createdAt?.toISOString?.() ?? "",
    updatedAt: trip.updatedAt?.toISOString?.() ?? "",
  };
}

export async function serializeTripWithGroups(trip: Parameters<typeof serializeTrip>[0]) {
  const base = serializeTrip(trip);
  const groups = await Group.find({ tripId: trip._id }).lean();
  return {
    ...base,
    groups: groups.map((group) => ({
      _id: idString(group._id),
      tripId: idString(group.tripId),
      name: group.name,
    })),
  };
}
