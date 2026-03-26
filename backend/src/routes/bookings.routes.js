const express = require("express");
const {
  createBooking,
  myBookings,
  agentBookings,
  updateBookingStatus,
} = require("../controllers/bookings.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const bookingsRouter = express.Router();

bookingsRouter.post("/", authenticate, authorize(ROLES.CUSTOMER), createBooking);
bookingsRouter.get("/my", authenticate, authorize(ROLES.CUSTOMER), myBookings);
bookingsRouter.get("/agent", authenticate, authorize(ROLES.AGENT), agentBookings);
bookingsRouter.patch(
  "/:id/status",
  authenticate,
  authorize(ROLES.AGENT, ROLES.ADMIN),
  updateBookingStatus
);

module.exports = { bookingsRouter };
