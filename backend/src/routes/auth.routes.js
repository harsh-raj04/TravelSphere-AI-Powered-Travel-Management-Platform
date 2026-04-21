const express = require("express");
const { register, login, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/authenticate");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);

module.exports = { authRouter };
