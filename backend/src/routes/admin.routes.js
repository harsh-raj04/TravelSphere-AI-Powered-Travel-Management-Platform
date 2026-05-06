const express = require("express");
const {
  listAllBookings,
  analyticsOverview,
  listAllPackages,
  listAllAgents,
  listAllCustomers,
  listAllTransactions,
  confirmBooking,
  updateBookingStatus,
  publishBookingToAgents,
  assignBookingAgent,
  listBookingApplications,
  listPackageInterests,
  selectBookingApplication,
  updateBookingPayout,
  getPackageById,
  updatePackage,
  featurePackage,
  togglePackageActive,
  listPackageHistory,
  listPackageAgents,
  listPackageReviews,
  getUserById,
  getAgentById,
} = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const adminRouter = express.Router();

adminRouter.use(authenticate, authorize(ROLES.ADMIN));
adminRouter.get("/bookings", listAllBookings);
adminRouter.patch("/bookings/:id/confirm", confirmBooking);
adminRouter.patch("/bookings/:id/status", updateBookingStatus);
adminRouter.patch("/bookings/:id/publish", publishBookingToAgents);
adminRouter.patch("/bookings/:id/assign-agent", assignBookingAgent);
adminRouter.patch("/bookings/:id/payout", updateBookingPayout);
adminRouter.get("/bookings/:id/applications", listBookingApplications);
adminRouter.patch("/bookings/:id/applications/:applicationId/select", selectBookingApplication);
adminRouter.get("/bookings/:id/applications", listBookingApplications);
adminRouter.get("/packages/:id/interests", listPackageInterests);
adminRouter.get("/packages/:id/history", listPackageHistory);
adminRouter.get("/packages/:id/agents", listPackageAgents);
adminRouter.get("/packages/:id/reviews", listPackageReviews);
adminRouter.get("/packages/:id", getPackageById);
adminRouter.put("/packages/:id", updatePackage);
adminRouter.patch("/packages/:id/feature", featurePackage);
adminRouter.patch("/packages/:id/active", togglePackageActive);
adminRouter.get("/packages", listAllPackages);
adminRouter.get("/agents/:id", getAgentById);
adminRouter.get("/agents", listAllAgents);
adminRouter.get("/users/:id", getUserById);
adminRouter.get("/customers", listAllCustomers);
adminRouter.get("/transactions", listAllTransactions);
adminRouter.get("/analytics/overview", analyticsOverview);

module.exports = { adminRouter };
