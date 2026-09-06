import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SeatSchema = new Schema(
  {
    seatNumber: { type: Number, required: true },
    passengerName: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["PAID", "UNPAID"],
      default: null,
    },
    paymentNote: { type: String, default: "" },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
  },
  { _id: false },
);

const TripSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    dateText: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PLANNED", "PUBLISHED", "COMPLETED"],
      default: null,
    },
    isArchived: { type: Boolean, default: false },
    seats: { type: [SeatSchema], required: true },
  },
  { timestamps: true },
);

export type SeatDoc = InferSchemaType<typeof SeatSchema>;
export type TripDoc = InferSchemaType<typeof TripSchema>;

export const Trip =
  (mongoose.models.Trip as mongoose.Model<TripDoc>) ??
  mongoose.model<TripDoc>("Trip", TripSchema);
