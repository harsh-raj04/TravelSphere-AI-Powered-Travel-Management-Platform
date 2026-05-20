const express = require("express");
const { register, login, me, sendRegistrationOtp, verifyOtpAndRegister } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/authenticate");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/send-registration-otp", sendRegistrationOtp);
authRouter.post("/verify-and-register", verifyOtpAndRegister);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);

module.exports = { authRouter };
