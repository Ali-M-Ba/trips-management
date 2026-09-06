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
import { logChange } from "@/lib/history";
import { PAYMENT_STATUSES } from "@/lib/types";
import { serializeSeat } from "@/lib/seats";

type Ctx = { params: Promise<{ id: string; seatNumber: string }> };

const schema = z.object({
  passengerName: z.string().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).nullable().optional(),
  paymentNote: z.string().optional(),
  groupId: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id, seatNumber } = await params;
  const number = Number(seatNumber);
  const trip = await findOwnedTrip(id, auth.user.id);
  if (!trip) return jsonError("Trip not found", 404);

  const seat = trip.seats.find((item) => item.seatNumber === number);
  if (!seat) return jsonError("Seat not found", 404);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid seat data");

  if (parsed.data.groupId) {
    const group = await Group.exists({
      _id: parsed.data.groupId,
      tripId: trip._id,
      userId: auth.user.id,
    });
    if (!group) return jsonError("Group not found", 404);
  }

  const before = serializeSeat(seat);

  if (parsed.data.passengerName !== undefined) {
    seat.passengerName = parsed.data.passengerName;
  }
  if (parsed.data.paymentNote !== undefined) {
    seat.paymentNote = parsed.data.paymentNote;
  }
  if (parsed.data.paymentStatus !== undefined) {
    seat.paymentStatus = parsed.data.paymentStatus;
  }
  if (parsed.data.groupId !== undefined) {
    seat.groupId =
      parsed.data.groupId && mongoose.isValidObjectId(parsed.data.groupId)
        ? new mongoose.Types.ObjectId(parsed.data.groupId)
        : null;
  }

  const hasInfo =
    Boolean(seat.passengerName?.trim()) ||
    Boolean(seat.paymentNote?.trim()) ||
    Boolean(seat.groupId);

  if (hasInfo && !seat.paymentStatus) {
    seat.paymentStatus = "UNPAID";
  }
  if (!hasInfo) {
    seat.paymentStatus = null;
  }

  await trip.save();
  const after = serializeSeat(seat);

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action:
      before.passengerName !== after.passengerName
        ? "Assigned passenger to seat"
        : "Changed payment/notes",
    description: `Updated seat ${number} on “${trip.name || "Untitled trip"}”.`,
    before,
    after,
  });

  return NextResponse.json({
    trip: await serializeTripWithGroups(trip, auth.user.id),
  });
}
