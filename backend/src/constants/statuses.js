const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  ASSIGNED: "assigned",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CLOSED: "closed",
  CANCELLED: "cancelled",
};

const TRANSACTION_STATUS = {
  INITIATED: "initiated",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
};

module.exports = { BOOKING_STATUS, TRANSACTION_STATUS };
