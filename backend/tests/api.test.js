const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/lib/prisma", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    agentProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    travelPackage: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  return { prisma };
});

const { prisma } = require("../src/lib/prisma");
const { app } = require("../src/app");

function tokenFor(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "replace_me", { expiresIn: "1h" });
}

describe("TravelSphere API", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "replace_me";
    jest.clearAllMocks();
  });

  test("GET /health returns healthy response", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("healthy");
  });

  test("POST /api/v1/auth/register validates payload", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "broken-payload",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/v1/auth/login returns invalid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  test("GET /api/v1/packages returns paginated data", async () => {
    prisma.travelPackage.findMany.mockResolvedValue([]);
    prisma.travelPackage.count.mockResolvedValue(0);

    const response = await request(app).get("/api/v1/packages?page=1&limit=5");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.total).toBe(0);
  });

  test("POST /api/v1/bookings rejects past travel date", async () => {
    const customerToken = tokenFor({
      id: "customer-1",
      email: "customer@travelsphere.dev",
      role: "customer",
    });

    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        package_id: "pkg-1",
        travel_date: "2020-01-01",
        travelers_count: 2,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  test("GET /api/v1/admin/bookings returns data for admin", async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count.mockResolvedValue(0);

    const adminToken = tokenFor({
      id: "admin-1",
      email: "admin@travelsphere.dev",
      role: "admin",
    });

    const response = await request(app)
      .get("/api/v1/admin/bookings")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.total).toBe(0);
  });

  test("POST /api/v1/transactions creates transaction for booking owner", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      customerId: "customer-1",
      package: { agentId: "agent-profile-1" },
    });

    prisma.transaction.upsert.mockResolvedValue({
      id: "txn-1",
      bookingId: "booking-1",
      amount: 1000,
      paymentMethod: "card",
      status: "success",
    });

    const customerToken = tokenFor({
      id: "customer-1",
      email: "customer@travelsphere.dev",
      role: "customer",
    });

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        booking_id: "booking-1",
        amount: 1000,
        method: "card",
        status: "success",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookingId).toBe("booking-1");
  });

  test("POST /api/v1/transactions rejects non-owner customer", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-2",
      customerId: "customer-2",
      package: { agentId: "agent-profile-1" },
    });

    const customerToken = tokenFor({
      id: "customer-1",
      email: "customer@travelsphere.dev",
      role: "customer",
    });

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        booking_id: "booking-2",
        amount: 500,
        method: "upi",
        status: "failed",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test("GET /api/v1/transactions/:bookingId returns transaction for admin", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-3",
      customerId: "customer-3",
      package: { agentId: "agent-profile-3" },
    });
    prisma.transaction.findUnique.mockResolvedValue({
      id: "txn-3",
      bookingId: "booking-3",
      amount: 3000,
      paymentMethod: "netbanking",
      status: "refunded",
    });

    const adminToken = tokenFor({
      id: "admin-1",
      email: "admin@travelsphere.dev",
      role: "admin",
    });

    const response = await request(app)
      .get("/api/v1/transactions/booking-3")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookingId).toBe("booking-3");
  });

  test("GET /api/v1/transactions/:bookingId returns 404 when transaction missing", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-4",
      customerId: "customer-4",
      package: { agentId: "agent-profile-4" },
    });
    prisma.transaction.findUnique.mockResolvedValue(null);

    const adminToken = tokenFor({
      id: "admin-1",
      email: "admin@travelsphere.dev",
      role: "admin",
    });

    const response = await request(app)
      .get("/api/v1/transactions/booking-4")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
