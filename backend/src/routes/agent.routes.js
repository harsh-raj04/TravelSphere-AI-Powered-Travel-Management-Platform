const express = require("express");
const {
  listPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../controllers/paymentMethods.controller");
const {
  getMyProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
} = require("../controllers/agentProfile.controller");
const {
  getEarningsSummary,
  getWithdrawalHistory,
  createWithdrawal,
} = require("../controllers/agentEarnings.controller");
const {
  getMyNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} = require("../controllers/notifications.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const agentRouter = express.Router();

// All routes require authentication and agent role
agentRouter.use(authenticate, authorize(ROLES.AGENT));

// ─── Agent Profile ─────────────────────────────────────────────────────────────
agentRouter.get("/profile", getMyProfile);
agentRouter.put("/profile", updateProfile);
agentRouter.post("/profile/request-email-change", requestEmailChange);
agentRouter.post("/profile/verify-email-change", verifyEmailChange);
agentRouter.post("/profile/request-phone-change", requestPhoneChange);
agentRouter.post("/profile/verify-phone-change", verifyPhoneChange);

// ─── Payment Methods ───────────────────────────────────────────────────────────
agentRouter.get("/payment-methods", listPaymentMethods);
agentRouter.post("/payment-methods", addPaymentMethod);
agentRouter.put("/payment-methods/:id", updatePaymentMethod);
agentRouter.delete("/payment-methods/:id", deletePaymentMethod);

// ─── Earnings & Withdrawals ────────────────────────────────────────────────────
agentRouter.get("/earnings/summary", getEarningsSummary);
agentRouter.get("/earnings/withdrawals", getWithdrawalHistory);
agentRouter.post("/earnings/withdraw", createWithdrawal);

// ─── Notifications ─────────────────────────────────────────────────────────────
// Note: specific routes BEFORE parameterised routes to avoid conflicts
agentRouter.get("/notifications/unread-count", getUnreadCount);
agentRouter.patch("/notifications/mark-all-read", markAllRead);
agentRouter.get("/notifications", getMyNotifications);
agentRouter.patch("/notifications/:id/read", markRead);

module.exports = { agentRouter };
