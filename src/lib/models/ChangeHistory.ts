import mongoose, { Schema } from "mongoose";

const ChangeHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", default: null },
    action: { type: String, required: true },
    description: { type: String, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true },
);

export const ChangeHistory =
  mongoose.models.ChangeHistory ??
  mongoose.model("ChangeHistory", ChangeHistorySchema);
