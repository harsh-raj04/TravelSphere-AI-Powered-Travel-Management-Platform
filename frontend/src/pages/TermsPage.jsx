import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using TravelSphere (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all visitors, users, and registered customers.`,
  },
  {
    title: '2. Eligibility',
    content: `You must be at least 18 years of age to create an account and make bookings on TravelSphere. By using the Platform, you confirm that you are 18 years of age or older and that all information you provide is accurate.`,
  },
  {
    title: '3. Booking & Payments',
    content: `All bookings are subject to availability. Prices displayed include all stated inclusions and applicable GST. Payment must be completed in full at the time of booking unless an instalment plan is explicitly offered. We reserve the right to cancel any booking if payment is not received or if payment is reversed after confirmation.`,
  },
  {
    title: '4. Cancellation & Refund Policy',
    content: `Cancellations made 30 or more days before the travel date are subject to a 10% charge. Cancellations 15–30 days before travel incur a 25% charge. Cancellations 7–15 days before travel incur a 50% charge. Cancellations within 7 days of travel are non-refundable. Specific packages may have different cancellation terms, which are stated on the package detail page. Refunds are processed within 5–7 business days to the original payment method.`,
  },
  {
    title: '5. Travel Requirements',
    content: `It is the traveler's responsibility to ensure they possess valid government-issued identification, any required permits, and appropriate travel insurance. TravelSphere is not responsible for denial of entry to restricted areas due to lack of valid permits or documentation.`,
  },
  {
    title: '6. Agent Responsibilities',
    content: `Travel packages are fulfilled by verified travel agents on our Platform. While we vet all agents, TravelSphere acts as an intermediary and is not directly responsible for the services delivered by agents. Any disputes between customers and agents should be raised through our support system.`,
  },
  {
    title: '7. Modifications to Itinerary',
    content: `TravelSphere reserves the right to modify itineraries due to weather conditions, natural events, government regulations, or other unforeseen circumstances. In such cases, customers will be notified and offered alternatives of equal or greater value where possible.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `TravelSphere shall not be liable for any loss, injury, or damage arising from circumstances beyond our control, including acts of God, government actions, natural disasters, epidemics, or third-party service failures. Our liability in any case is limited to the amount paid for the affected booking.`,
  },
  {
    title: '9. Privacy',
    content: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Punjab, India.`,
  },
  {
    title: '11. Changes to Terms',
    content: `TravelSphere reserves the right to update these Terms at any time. We will notify registered users of material changes via email. Continued use of the Platform after such changes constitutes acceptance of the revised Terms.`,
  },
  {
    title: '12. Contact',
    content: `For any questions about these Terms, contact us at support@travelsphere.dev or call +91 7992336832.`,
  },
];

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-teal-100">Last updated: January 1, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            These Terms of Service govern your use of the TravelSphere platform. Please read them carefully before using our services.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{section.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For questions, visit our{' '}
              <Link to="/faq" className="text-teal-600 hover:underline">FAQ</Link>
              {' '}or{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">Contact Us</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
