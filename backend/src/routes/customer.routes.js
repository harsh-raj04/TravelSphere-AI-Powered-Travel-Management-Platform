const express = require("express");
const { getProfile, updateProfile, changePassword } = require("../controllers/customer.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const customerRouter = express.Router();

customerRouter.get("/profile", authenticate, authorize(ROLES.CUSTOMER), getProfile);
customerRouter.patch("/profile", authenticate, authorize(ROLES.CUSTOMER), updateProfile);
customerRouter.patch("/password", authenticate, authorize(ROLES.CUSTOMER), changePassword);

module.exports = { customerRouter };
