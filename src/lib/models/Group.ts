import mongoose, { Schema } from "mongoose";

const GroupSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const Group =
  mongoose.models.Group ?? mongoose.model("Group", GroupSchema);
