const express = require("express");
const {
  createBooking,
  myBookings,
  agentBookings,
  marketplaceBookings,
  marketplaceBookingDetails,
  applyForBooking,
  myApplications,
  updateBookingStatus,
  requestBookingChange,
  submitBookingFeedback,
} = require("../controllers/bookings.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const bookingsRouter = express.Router();

bookingsRouter.post("/", authenticate, authorize(ROLES.CUSTOMER), createBooking);
bookingsRouter.get("/my", authenticate, authorize(ROLES.CUSTOMER), myBookings);
bookingsRouter.get("/agent", authenticate, authorize(ROLES.AGENT), agentBookings);
bookingsRouter.get("/marketplace", authenticate, authorize(ROLES.AGENT), marketplaceBookings);
bookingsRouter.get("/marketplace/:id", authenticate, authorize(ROLES.AGENT), marketplaceBookingDetails);
bookingsRouter.post("/:id/apply", authenticate, authorize(ROLES.AGENT), applyForBooking);
bookingsRouter.get("/applications/my", authenticate, authorize(ROLES.AGENT), myApplications);
bookingsRouter.patch(
  "/:id/status",
  authenticate,
  authorize(ROLES.AGENT, ROLES.ADMIN),
  updateBookingStatus
);
bookingsRouter.patch(
  "/:id/request-change",
  authenticate,
  authorize(ROLES.AGENT),
  requestBookingChange
);
bookingsRouter.patch(
  "/:id/feedback",
  authenticate,
  authorize(ROLES.CUSTOMER),
  submitBookingFeedback
);

module.exports = { bookingsRouter };
