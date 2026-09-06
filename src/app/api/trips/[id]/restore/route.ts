import { NextResponse } from "next/server";
import {
  findOwnedTrip,
  jsonError,
  requireUser,
  serializeTrip,
} from "@/lib/api";
import { logChange } from "@/lib/history";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const trip = await findOwnedTrip(id, auth.user.id);
  if (!trip) return jsonError("Trip not found", 404);

  trip.isArchived = false;
  await trip.save();

  await logChange({
    userId: auth.user.id,
    tripId: String(trip._id),
    action: "Restored trip",
    description: `Restored “${trip.name || "Untitled trip"}” from the archive.`,
    before: { isArchived: true },
    after: { isArchived: false },
  });

  return NextResponse.json({ trip: serializeTrip(trip) });
}
