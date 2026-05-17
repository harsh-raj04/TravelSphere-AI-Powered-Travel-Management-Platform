const express = require("express");
const { authRouter } = require("./auth.routes");
const { packagesRouter } = require("./packages.routes");
const { bookingsRouter } = require("./bookings.routes");
const { paymentsRouter } = require("./payments.routes");
const { transactionsRouter } = require("./transactions.routes");
const { adminRouter } = require("./admin.routes");
const { agentRouter } = require("./agent.routes");
const { ticketsRouter } = require("./tickets.routes");
const { newsletterRouter } = require("./newsletter.routes");
const { customerRouter } = require("./customer.routes");
const { customRequestsRouter } = require("./customRequests.routes");
const { aiRouter } = require("./ai.routes");
const { chatRouter } = require("./chat.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/packages", packagesRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/agent", agentRouter);
apiRouter.use("/tickets", ticketsRouter);
apiRouter.use("/newsletter", newsletterRouter);
apiRouter.use("/customer", customerRouter);
apiRouter.use("/custom-requests", customRequestsRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/chat", chatRouter);

module.exports = { apiRouter };
