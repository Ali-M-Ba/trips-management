import { Trip } from "@/lib/models/Trip";
import { Group } from "@/lib/models/Group";

export async function cleanupEmptyGroups(tripId: string, userId: string) {
  const trip = await Trip.findOne({ _id: tripId, userId });
  if (!trip) return;
  const used = new Set(
    trip.seats
      .map((seat) => (seat.groupId ? String(seat.groupId) : null))
      .filter((value): value is string => Boolean(value)),
  );
  const groups = await Group.find({ tripId, userId });
  for (const group of groups) {
    if (!used.has(String(group._id))) {
      await group.deleteOne();
    }
  }
}
