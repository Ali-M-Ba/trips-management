import { NextResponse } from "next/server";
import { z } from "zod";
import { Group } from "@/lib/models/Group";
import {
  findOwnedTrip,
  jsonError,
  requireUser,
  serializeTripWithGroups,
} from "@/lib/api";
import { logChange } from "@/lib/history";
import { cleanupEmptyGroups } from "@/lib/groups";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(1),
  seatNumbers: z.array(z.number().int().min(1).max(52)).min(1),
});

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const trip = await findOwnedTrip(id, auth.user.id);
  if (!trip) return jsonError("Trip not found", 404);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Select seats and enter a group name");

  const group = await Group.create({
    userId: auth.user.id,
    tripId: trip._id,
    name: parsed.data.name,
  });

  const before = parsed.data.seatNumbers.map((seatNumber) => {
    const seat = trip.seats.find((item) => item.seatNumber === seatNumber);
    return { seatNumber, groupId: seat?.groupId ? String(seat.groupId) : null };
  });

  for (const seatNumber of parsed.data.seatNumbers) {
    const seat = trip.seats.find((item) => item.seatNumber === seatNumber);
    if (seat) {
      seat.groupId = group._id;
      if (!seat.paymentStatus) seat.paymentStatus = "UNPAID";
    }
  }

  await trip.save();
  await cleanupEmptyGroups(String(trip._id), auth.user.id);

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action: "Grouped seats",
    description: `Grouped seats ${parsed.data.seatNumbers.join(", ")} as “${group.name}”.`,
    before,
    after: {
      groupId: String(group._id),
      name: group.name,
      seatNumbers: parsed.data.seatNumbers,
    },
  });

  return NextResponse.json({
    trip: await serializeTripWithGroups(trip, auth.user.id),
  });
}
