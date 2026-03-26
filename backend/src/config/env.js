const dotenv = require("dotenv");

dotenv.config();

const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "replace_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DATABASE_URL: process.env.DATABASE_URL || "",
};

module.exports = { env };
