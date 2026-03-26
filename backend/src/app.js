const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { apiRouter } = require("./routes");
const { notFoundHandler } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TravelSphere backend is healthy",
    data: { uptime: process.uptime() },
  });
});

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };