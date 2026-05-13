const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { apiRouter } = require("./routes");
const { notFoundHandler } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

const path = require("path");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded images with caching headers
app.use("/images", express.static(path.join(__dirname, "..", "public", "images"), {
  maxAge: "7d",
  etag: true,
  lastModified: true,
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  },
}));

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