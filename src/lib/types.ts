export const TRIP_STATUSES = ["PLANNED", "PUBLISHED", "COMPLETED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SEAT_COUNT = 52;

export type Seat = {
  seatNumber: number;
  passengerName: string;
  paymentStatus: PaymentStatus | null;
  paymentNote: string;
  groupId: string | null;
};

export type Group = {
  _id: string;
  tripId: string;
  name: string;
};

export type Trip = {
  _id: string;
  name: string;
  dateText: string;
  status: TripStatus | null;
  isArchived: boolean;
  seats: Seat[];
  createdAt: string;
  updatedAt: string;
};

export type TripWithGroups = Trip & { groups: Group[] };

export type TripStats = {
  total: number;
  occupied: number;
  free: number;
  paid: number;
  unpaid: number;
};

export type DashboardStats = {
  plannedTrips: number;
  occupiedSeats: number;
  unpaidSeats: number;
};

export type HistoryEntry = {
  _id: string;
  userId: string;
  userLogin?: string;
  tripId: string | null;
  tripName?: string;
  action: string;
  description: string;
  before: unknown;
  after: unknown;
  date: string;
  time: string;
};

export type SessionUser = {
  id: string;
  login: string;
  name: string;
};
