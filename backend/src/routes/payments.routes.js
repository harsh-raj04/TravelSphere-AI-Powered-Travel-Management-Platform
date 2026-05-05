const express = require("express");
const { createOrder, verifyPayment, getKeyId } = require("../controllers/payments.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const paymentsRouter = express.Router();

paymentsRouter.post("/create-order", authenticate, authorize(ROLES.CUSTOMER), createOrder);
paymentsRouter.post("/verify", authenticate, authorize(ROLES.CUSTOMER), verifyPayment);
paymentsRouter.get("/key", getKeyId);

module.exports = { paymentsRouter };
