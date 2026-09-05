import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Trip } from "@/lib/models/Trip";
import { Group } from "@/lib/models/Group";
import { jsonError, requireUser, serializeTripWithGroups } from "@/lib/api";
import { logChange } from "@/lib/history";
import { cleanupEmptyGroups } from "@/lib/groups";

type Ctx = { params: Promise<{ id: string; groupId: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id, groupId } = await params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(groupId)) {
    return jsonError("Group not found", 404);
  }

  const trip = await Trip.findById(id);
  if (!trip) return jsonError("Trip not found", 404);

  const group = await Group.findOne({ _id: groupId, tripId: trip._id });
  if (!group) return jsonError("Group not found", 404);

  const savedGroupId = String(group._id);
  const seatNumbers = trip.seats
    .filter((seat) => String(seat.groupId) === savedGroupId)
    .map((seat) => seat.seatNumber);

  for (const seat of trip.seats) {
    if (String(seat.groupId) === savedGroupId) {
      seat.groupId = null;
      const stillOccupied =
        Boolean(seat.passengerName?.trim()) || Boolean(seat.paymentNote?.trim());
      if (!stillOccupied) seat.paymentStatus = null;
    }
  }

  await trip.save();
  await group.deleteOne();
  await cleanupEmptyGroups(id);

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action: "Ungrouped seats",
    description: `Removed group “${group.name}” from seats ${seatNumbers.join(", ")}.`,
    before: { groupId: savedGroupId, name: group.name, seatNumbers },
    after: { groupId: null },
  });

  return NextResponse.json({ trip: await serializeTripWithGroups(trip) });
}
