import { ChangeHistory } from "@/lib/models/ChangeHistory";
import { todayParts } from "@/lib/utils";

export async function logChange(input: {
  userId: string;
  tripId?: string | null;
  action: string;
  description: string;
  before?: unknown;
  after?: unknown;
}) {
  const { date, time } = todayParts();
  await ChangeHistory.create({
    userId: input.userId,
    tripId: input.tripId ?? null,
    action: input.action,
    description: input.description,
    before: input.before ?? null,
    after: input.after ?? null,
    date,
    time,
  });
}
