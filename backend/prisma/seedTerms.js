const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const termsSections = [
  {
    order: 1,
    title: 'Booking & Payment Policy',
    content: `• A booking is confirmed only upon receipt of the advance deposit (minimum 25% of total tour cost) and issuance of a written confirmation by TravelSphere.
• The remaining balance must be paid in full at least 15 days before the departure date. Failure to do so may result in automatic cancellation of the booking without a refund of the deposit.
• All prices are quoted in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
• Prices are subject to change until the booking is confirmed in writing. Once confirmed, the price is fixed.
• Payment can be made via UPI, Net Banking, Credit/Debit Card, or any other method accepted by TravelSphere.`,
  },
  {
    order: 2,
    title: 'Cancellation & Refund Policy',
    content: `The following cancellation charges apply from the date of written cancellation request:

• 30 or more days before departure: 10% of total tour cost (booking/processing fee — non-refundable)
• 15–29 days before departure: 25% of total tour cost
• 7–14 days before departure: 50% of total tour cost
• 48 hours – 6 days before departure: 75% of total tour cost
• Less than 48 hours before departure or no-show: 100% of total tour cost (no refund)

Refunds (where applicable) will be processed within 7–10 working days to the original payment method. TravelSphere reserves the right to deduct any third-party cancellation charges (hotels, airlines, permits) from the refundable amount.`,
  },
  {
    order: 3,
    title: 'Weather, Natural Disasters & Force Majeure',
    content: `• If a tour or any part of it is cancelled or significantly altered by TravelSphere due to severe weather conditions (snowstorm, cyclone, flood, landslide, etc.), natural disasters, government orders, or any other force majeure event beyond our control, affected customers will be offered:
  (a) A full credit note valid for 12 months for any future booking of equal or greater value, OR
  (b) A refund of the unutilised, recoverable portion of the tour cost after deducting non-recoverable third-party payments (hotel pre-pays, permit fees, etc.).
• TravelSphere is not liable for delays, curtailments, or additional expenses incurred due to force majeure events.
• Customers are strongly advised to purchase comprehensive travel insurance that covers trip cancellation, curtailment, and natural disasters.`,
  },
  {
    order: 4,
    title: 'Itinerary Changes',
    content: `• TravelSphere reserves the right to alter, amend, or substitute any itinerary, accommodation, transport, or service without prior notice if circumstances beyond our control require it, or to ensure the safety and comfort of travellers.
• Changes made before departure: Customers will be notified at the earliest opportunity and offered alternatives of comparable standard. No compensation is payable for minor changes (route adjustments, hotel of equivalent grade).
• Changes made during travel: The tour leader/guide will make decisions in the best interest of the group. Refunds for unused services due to such changes will be assessed case by case.
• Optional activities shown in the itinerary are not guaranteed and may be subject to availability, weather, and local conditions.`,
  },
  {
    order: 5,
    title: 'Travel Insurance',
    content: `• TravelSphere strongly recommends that all travellers purchase a comprehensive travel insurance policy before departure covering: medical emergencies, hospitalisation, trip cancellation, trip curtailment, loss of baggage, and personal liability.
• TravelSphere does not provide travel insurance as part of any package unless explicitly stated.
• In the event of a medical emergency, TravelSphere staff will assist in arranging medical help; however, all costs incurred are solely the traveller's responsibility.`,
  },
  {
    order: 6,
    title: 'Health, Fitness & Special Requirements',
    content: `• It is the traveller's responsibility to ensure they are medically fit to undertake the chosen tour. Certain destinations (e.g., high-altitude regions like Leh-Ladakh, Kedarnath) require a minimum fitness level.
• Travellers with pre-existing medical conditions must disclose them at the time of booking. TravelSphere reserves the right to decline a booking if the traveller's condition may pose a risk to themselves or others.
• Special requirements (dietary restrictions, wheelchair access, allergies) must be communicated in writing at the time of booking. TravelSphere will make reasonable efforts to accommodate these but cannot guarantee fulfilment in all cases.
• Pregnant travellers beyond 24 weeks may not be permitted on certain adventure or high-altitude tours.`,
  },
  {
    order: 7,
    title: 'Passport, Visa & Travel Documents',
    content: `• It is solely the traveller's responsibility to possess a valid passport (minimum 6 months validity beyond the travel date), appropriate visa, and any permits required for the destination.
• TravelSphere will assist with general information regarding visa requirements but is not responsible for visa rejections, delays, or any consequences arising therefrom.
• Inner Line Permits (ILP), Protected Area Permits (PAP), or any special permits required for restricted areas (e.g., Ladakh, Andaman, North-East India) must be arranged by the traveller or will be facilitated by TravelSphere for an additional fee where applicable.
• No refund will be provided if a traveller is denied entry to any region due to improper documentation.`,
  },
  {
    order: 8,
    title: 'Liability & Disclaimer',
    content: `• TravelSphere acts as an organiser and agent for hotels, transport operators, and other service providers. We are not liable for any injury, loss, damage, additional expense, or delay caused by the negligence of such third-party providers.
• TravelSphere is not responsible for loss or damage to personal belongings during the tour. Travellers are advised to carry valuables on their person and use hotel safes where available.
• TravelSphere's maximum liability under any circumstances shall not exceed the total tour cost paid by the affected traveller.
• Images and descriptions in our promotional material are representative and may differ from actual conditions.`,
  },
  {
    order: 9,
    title: 'Code of Conduct',
    content: `• Travellers are expected to behave respectfully towards fellow travellers, tour guides, local communities, and the natural environment.
• Any behaviour deemed disruptive, offensive, or dangerous by the tour leader may result in the traveller being asked to leave the tour without refund.
• Consumption of alcohol or controlled substances that impairs a traveller's ability to participate safely is not permitted.
• Travellers must adhere to all local laws, regulations, and cultural norms at the destination.`,
  },
  {
    order: 10,
    title: 'Amendments to Terms',
    content: `• TravelSphere reserves the right to amend these Terms & Conditions at any time. The version in effect at the time of booking confirmation shall govern the booking.
• By completing a booking with TravelSphere, the traveller acknowledges that they have read, understood, and agreed to these Terms & Conditions in their entirety.
• For any disputes, the courts of Phagwara, Punjab, India shall have exclusive jurisdiction. Indian law shall govern all matters.
• For queries or concerns, contact us at: support@travelsphere.in or +91 7992336832.`,
  },
];

async function main() {
  console.log('Seeding terms sections...');

  // Clear existing terms
  await prisma.termsSection.deleteMany({});

  for (const section of termsSections) {
    await prisma.termsSection.create({ data: section });
  }

  console.log(`✓ Seeded ${termsSections.length} terms sections`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
