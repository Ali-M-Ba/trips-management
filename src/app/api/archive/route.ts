import { NextResponse } from "next/server";
import { Trip } from "@/lib/models/Trip";
import { requireUser, serializeTrip } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const trips = await Trip.find({
    userId: auth.user.id,
    isArchived: true,
  }).sort({
    updatedAt: -1,
  });
  return NextResponse.json({ trips: trips.map(serializeTrip) });
}
