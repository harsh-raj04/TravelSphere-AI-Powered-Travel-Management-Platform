const express = require("express");
const {
  listAllBookings,
  analyticsOverview,
  listAllPackages,
  listAllAgents,
  listAllCustomers,
  listAllTransactions,
} = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const adminRouter = express.Router();

adminRouter.use(authenticate, authorize(ROLES.ADMIN));
adminRouter.get("/bookings", listAllBookings);
adminRouter.get("/analytics/overview", analyticsOverview);
adminRouter.get("/packages", listAllPackages);
adminRouter.get("/agents", listAllAgents);
adminRouter.get("/customers", listAllCustomers);
adminRouter.get("/transactions", listAllTransactions);

module.exports = { adminRouter };
