import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { Group } from "@/lib/models/Group";
import {
  findOwnedTrip,
  jsonError,
  requireUser,
  serializeTripWithGroups,
} from "@/lib/api";
import { PAYMENT_STATUSES } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  seats: z.array(
    z.object({
      seatNumber: z.number(),
      passengerName: z.string(),
      paymentStatus: z.enum(PAYMENT_STATUSES).nullable(),
      paymentNote: z.string(),
      groupId: z.string().nullable(),
    }),
  ),
  groups: z.array(
    z.object({
      _id: z.string(),
      name: z.string(),
    }),
  ),
});

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const trip = await findOwnedTrip(id, auth.user.id);
  if (!trip) return jsonError("Trip not found", 404);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid snapshot");

  await Group.deleteMany({ tripId: trip._id, userId: auth.user.id });

  const idMap = new Map<string, mongoose.Types.ObjectId>();
  for (const group of parsed.data.groups) {
    const objectId = mongoose.isValidObjectId(group._id)
      ? new mongoose.Types.ObjectId(group._id)
      : new mongoose.Types.ObjectId();
    idMap.set(group._id, objectId);
    await Group.create({
      _id: objectId,
      userId: auth.user.id,
      tripId: trip._id,
      name: group.name,
    });
  }

  trip.set(
    "seats",
    parsed.data.seats.map((seat) => ({
      seatNumber: seat.seatNumber,
      passengerName: seat.passengerName,
      paymentStatus: seat.paymentStatus,
      paymentNote: seat.paymentNote,
      groupId: seat.groupId ? (idMap.get(seat.groupId) ?? null) : null,
    })),
  );

  await trip.save();
  return NextResponse.json({
    trip: await serializeTripWithGroups(trip, auth.user.id),
  });
}
