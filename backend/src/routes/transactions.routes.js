const express = require("express");
const {
  createTransaction,
  getTransactionByBookingId,
} = require("../controllers/transactions.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const transactionsRouter = express.Router();

transactionsRouter.post(
  "/",
  authenticate,
  authorize(ROLES.CUSTOMER, ROLES.ADMIN),
  createTransaction
);
transactionsRouter.get(
  "/:bookingId",
  authenticate,
  authorize(ROLES.CUSTOMER, ROLES.AGENT, ROLES.ADMIN),
  getTransactionByBookingId
);

module.exports = { transactionsRouter };
