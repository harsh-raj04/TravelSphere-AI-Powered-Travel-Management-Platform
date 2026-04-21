const express = require("express");
const { authRouter } = require("./auth.routes");
const { packagesRouter } = require("./packages.routes");
const { bookingsRouter } = require("./bookings.routes");
const { transactionsRouter } = require("./transactions.routes");
const { adminRouter } = require("./admin.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/packages", packagesRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/admin", adminRouter);

module.exports = { apiRouter };
