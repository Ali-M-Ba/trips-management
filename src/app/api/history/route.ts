import { NextResponse } from "next/server";
import { ChangeHistory } from "@/lib/models/ChangeHistory";
import { User } from "@/lib/models/User";
import { Trip } from "@/lib/models/Trip";
import { requireUser } from "@/lib/api";
import { idString } from "@/lib/utils";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const entries = await ChangeHistory.find({ userId: auth.user.id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const userIds = [...new Set(entries.map((entry) => String(entry.userId)))];
  const tripIds = [
    ...new Set(
      entries
        .map((entry) => (entry.tripId ? String(entry.tripId) : null))
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const users = await User.find({ _id: { $in: userIds } }).lean();
  const trips = await Trip.find({
    _id: { $in: tripIds },
    userId: auth.user.id,
  }).lean();
  const userMap = new Map(users.map((user) => [String(user._id), user.login]));
  const tripMap = new Map(trips.map((trip) => [String(trip._id), trip.name]));

  return NextResponse.json({
    entries: entries.map((entry) => ({
      _id: idString(entry._id),
      userId: idString(entry.userId),
      userLogin: userMap.get(String(entry.userId)) ?? "",
      tripId: entry.tripId ? idString(entry.tripId) : null,
      tripName: entry.tripId ? (tripMap.get(String(entry.tripId)) ?? "") : "",
      action: entry.action,
      description: entry.description,
      before: entry.before,
      after: entry.after,
      date: entry.date,
      time: entry.time,
    })),
  });
}
