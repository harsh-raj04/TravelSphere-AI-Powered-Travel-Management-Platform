const bcrypt = require("bcryptjs");
const { PrismaClient, Role, BookingStatus, TransactionStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@travelsphere.dev";
  const customerEmail = "customer@travelsphere.dev";
  const agentEmail = "agent@travelsphere.dev";

  const passwordHash = await bcrypt.hash("Password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Platform Admin",
      passwordHash,
      role: Role.admin,
    },
    create: {
      name: "Platform Admin",
      email: adminEmail,
      passwordHash,
      role: Role.admin,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      name: "Demo Customer",
      passwordHash,
      role: Role.customer,
    },
    create: {
      name: "Demo Customer",
      email: customerEmail,
      passwordHash,
      role: Role.customer,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {
      name: "Demo Agent",
      passwordHash,
      role: Role.agent,
    },
    create: {
      name: "Demo Agent",
      email: agentEmail,
      passwordHash,
      role: Role.agent,
    },
  });

  const agentProfile = await prisma.agentProfile.upsert({
    where: { userId: agent.id },
    update: {
      agencyName: "Skyline Trails",
      bio: "Curated domestic and international tours",
      contactNumber: "+91-9000000000",
      isVerified: true,
    },
    create: {
      userId: agent.id,
      agencyName: "Skyline Trails",
      bio: "Curated domestic and international tours",
      contactNumber: "+91-9000000000",
      isVerified: true,
    },
  });

  const packageOne = await prisma.travelPackage.upsert({
    where: {
      id: "seed-package-1",
    },
    update: {
      title: "Himachal Escape",
      destination: "Himachal Pradesh",
      durationDays: 5,
      price: 18999,
      description: "Mountain tour including stay, local transport, and guided activities.",
      itinerary: [
        "Arrival and local sightseeing",
        "Mountain valley excursion",
        "Adventure activities and campfire",
        "Cultural village walk",
        "Departure",
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
        "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef",
      ],
      isActive: true,
      agentId: agentProfile.id,
    },
    create: {
      id: "seed-package-1",
      title: "Himachal Escape",
      destination: "Himachal Pradesh",
      durationDays: 5,
      price: 18999,
      description: "Mountain tour including stay, local transport, and guided activities.",
      itinerary: [
        "Arrival and local sightseeing",
        "Mountain valley excursion",
        "Adventure activities and campfire",
        "Cultural village walk",
        "Departure",
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
        "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef",
      ],
      isActive: true,
      agentId: agentProfile.id,
    },
  });

  const packageTwo = await prisma.travelPackage.upsert({
    where: {
      id: "seed-package-2",
    },
    update: {
      title: "Goa Weekend Retreat",
      destination: "Goa",
      durationDays: 3,
      price: 11999,
      description: "Beachside weekend package with transfers and curated activities.",
      itinerary: [
        "Arrival and beach leisure",
        "Water sports and nightlife",
        "Local market and departure",
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86",
      ],
      isActive: true,
      agentId: agentProfile.id,
    },
    create: {
      id: "seed-package-2",
      title: "Goa Weekend Retreat",
      destination: "Goa",
      durationDays: 3,
      price: 11999,
      description: "Beachside weekend package with transfers and curated activities.",
      itinerary: [
        "Arrival and beach leisure",
        "Water sports and nightlife",
        "Local market and departure",
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86",
      ],
      isActive: true,
      agentId: agentProfile.id,
    },
  });

  const booking = await prisma.booking.upsert({
    where: { id: "seed-booking-1" },
    update: {
      customerId: customer.id,
      packageId: packageOne.id,
      customerName: customer.name,
      contactEmail: customer.email,
      contactPhone: "+91-9001112222",
      travelersCount: 2,
      status: BookingStatus.confirmed,
      totalAmount: 37998,
      travelDate: new Date("2030-03-15T00:00:00.000Z"),
    },
    create: {
      id: "seed-booking-1",
      customerId: customer.id,
      packageId: packageOne.id,
      customerName: customer.name,
      contactEmail: customer.email,
      contactPhone: "+91-9001112222",
      travelersCount: 2,
      status: BookingStatus.confirmed,
      totalAmount: 37998,
      travelDate: new Date("2030-03-15T00:00:00.000Z"),
    },
  });

  await prisma.transaction.upsert({
    where: { bookingId: booking.id },
    update: {
      amount: booking.totalAmount,
      paymentMethod: "upi",
      status: TransactionStatus.success,
      transactionReference: `SEED-TXN-${booking.id}`,
    },
    create: {
      bookingId: booking.id,
      amount: booking.totalAmount,
      paymentMethod: "upi",
      status: TransactionStatus.success,
      transactionReference: `SEED-TXN-${booking.id}`,
    },
  });

  console.log("Seed completed");
  console.log({
    admin: admin.email,
    customer: customer.email,
    agent: agent.email,
    packageCount: 2,
    bookingId: booking.id,
  });
  console.log("Default password for all seeded users: Password123");
  console.log(`Additional demo package: ${packageTwo.title}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });