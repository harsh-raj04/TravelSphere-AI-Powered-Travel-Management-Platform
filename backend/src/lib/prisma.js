const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Enable connection pooling
prisma.$connect().then(() => {
  console.log("✓ Database connection pool established");
}).catch((err) => {
  console.error("✗ Database connection failed:", err.message);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };

