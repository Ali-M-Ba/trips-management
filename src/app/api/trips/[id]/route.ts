import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { Trip } from "@/lib/models/Trip";
import { Group } from "@/lib/models/Group";
import { jsonError, requireUser, serializeTripWithGroups } from "@/lib/api";
import { logChange } from "@/lib/history";
import { TRIP_STATUSES } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("Trip not found", 404);

  const trip = await Trip.findById(id);
  if (!trip) return jsonError("Trip not found", 404);

  return NextResponse.json({ trip: await serializeTripWithGroups(trip) });
}

const patchSchema = z.object({
  name: z.string().trim().min(1, "Trip name is required").optional(),
  dateText: z.string().trim().optional(),
  status: z.enum(TRIP_STATUSES).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const trip = await Trip.findById(id);
  if (!trip) return jsonError("Trip not found", 404);

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid trip data");

  const before = {
    name: trip.name,
    dateText: trip.dateText,
    status: trip.status,
  };

  if (parsed.data.name !== undefined) trip.name = parsed.data.name;
  if (parsed.data.dateText !== undefined) trip.dateText = parsed.data.dateText;
  if (parsed.data.status !== undefined) trip.status = parsed.data.status;
  await trip.save();

  const after = {
    name: trip.name,
    dateText: trip.dateText,
    status: trip.status,
  };

  const action =
    parsed.data.name !== undefined && parsed.data.name !== before.name
      ? "Changed trip name"
      : parsed.data.status !== undefined
        ? "Changed trip status"
        : "Edited trip";

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action,
    description: `${action} for “${trip.name || "Untitled trip"}”.`,
    before,
    after,
  });

  return NextResponse.json({ trip: await serializeTripWithGroups(trip) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const trip = await Trip.findById(id);
  if (!trip) return jsonError("Trip not found", 404);

  const snapshot = {
    name: trip.name,
    dateText: trip.dateText,
    status: trip.status,
  };

  await Group.deleteMany({ tripId: trip._id });
  await trip.deleteOne();

  await logChange({
    userId: auth.user.id,
    tripId: null,
    action: "Deleted trip permanently",
    description: `Permanently deleted “${snapshot.name || "Untitled trip"}”.`,
    before: snapshot,
    after: null,
  });

  return NextResponse.json({ ok: true });
}
