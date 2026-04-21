const express = require("express");
const {
  listAllBookings,
  analyticsOverview,
} = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const adminRouter = express.Router();

adminRouter.use(authenticate, authorize(ROLES.ADMIN));
adminRouter.get("/bookings", listAllBookings);
adminRouter.get("/analytics/overview", analyticsOverview);

module.exports = { adminRouter };
