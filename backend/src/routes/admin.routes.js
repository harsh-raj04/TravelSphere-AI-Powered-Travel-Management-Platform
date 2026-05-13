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
const {
  listWithdrawals,
  approveWithdrawal,
  completeWithdrawal,
  failWithdrawal,
} = require("../controllers/adminWithdrawals.controller");
const {
  listTickets,
  getTicketStats,
  getTicket,
  adminReply,
  updateTicket,
} = require("../controllers/adminTickets.controller");
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

// ─── Agent withdrawal management ──────────────────────────────────────────────
adminRouter.get("/withdrawals", listWithdrawals);
adminRouter.patch("/withdrawals/:id/approve", approveWithdrawal);
adminRouter.patch("/withdrawals/:id/complete", completeWithdrawal);
adminRouter.patch("/withdrawals/:id/fail", failWithdrawal);

// ─── Support tickets (admin) ───────────────────────────────────────────────────
// Note: stats route BEFORE :id to prevent conflict
adminRouter.get("/tickets/stats", getTicketStats);
adminRouter.get("/tickets", listTickets);
adminRouter.get("/tickets/:id", getTicket);
adminRouter.post("/tickets/:id/messages", adminReply);
adminRouter.patch("/tickets/:id", updateTicket);

module.exports = { adminRouter };
