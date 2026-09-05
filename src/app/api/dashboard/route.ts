import { NextResponse } from "next/server";
import { Trip } from "@/lib/models/Trip";
import { requireUser, serializeTrip } from "@/lib/api";
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const trips = await Trip.find({ isArchived: false }).lean();
  const serialized = trips.map(serializeTrip);

  const plannedTrips = serialized.filter((trip) => trip.status === "PLANNED").length;
  const occupiedSeats = serialized.reduce((sum, trip) => sum + trip.stats.occupied, 0);
  const unpaidSeats = serialized.reduce((sum, trip) => sum + trip.stats.unpaid, 0);

  return NextResponse.json({
    user: auth.user,
    stats: { plannedTrips, occupiedSeats, unpaidSeats },
    trips: serialized.map((trip) => ({
      _id: trip._id,
      name: trip.name,
      dateText: trip.dateText,
      freeSeats: trip.stats.free,
    })),
  });
}
