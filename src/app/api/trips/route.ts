import { NextResponse } from "next/server";
import { z } from "zod";
import { Trip } from "@/lib/models/Trip";
import { requireUser, serializeTrip, jsonError } from "@/lib/api";
import { createEmptySeats } from "@/lib/seats";
import { logChange } from "@/lib/history";
import { TRIP_STATUSES } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().optional().default(""),
  dateText: z.string().trim().optional().default(""),
  status: z.enum(TRIP_STATUSES).nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid trip data");

  const trip = await Trip.create({
    name: parsed.data.name,
    dateText: parsed.data.dateText,
    status: parsed.data.status ?? null,
    isArchived: false,
    seats: createEmptySeats(),
  });

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action: "Created trip",
    description: `Created trip “${trip.name || "Untitled trip"}”.`,
    before: null,
    after: {
      name: trip.name,
      dateText: trip.dateText,
      status: trip.status,
    },
  });

  return NextResponse.json({ trip: serializeTrip(trip) }, { status: 201 });
}
