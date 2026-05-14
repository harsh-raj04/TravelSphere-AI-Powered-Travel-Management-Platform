const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function subscribe(req, res) {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (existing) {
    if (existing.isActive) {
      return res.status(409).json({ message: 'This email is already subscribed.' });
    }
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: true, unsubscribedAt: null },
    });
    return res.json({ message: 'Welcome back! You\'ve been resubscribed.' });
  }

  await prisma.newsletterSubscriber.create({ data: { email } });
  return res.status(201).json({ message: 'Successfully subscribed! Welcome to the TravelSphere community.' });
}

async function unsubscribe(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (!existing || !existing.isActive) {
    return res.status(404).json({ message: 'Email not found in our subscriber list.' });
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: { isActive: false, unsubscribedAt: new Date() },
  });

  return res.json({ message: 'You have been unsubscribed successfully.' });
}

module.exports = { subscribe, unsubscribe };
