import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide when creating an account (name, email, phone number), making bookings (travel details, payment information), and using our services. We also automatically collect usage data (pages visited, features used, device info, IP address) through cookies and analytics tools.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to: process bookings and payments; send booking confirmations, updates, and receipts; provide customer support; personalize your experience; send newsletters and promotional offers (with your consent); improve our services through analytics; and comply with legal obligations.`,
  },
  {
    title: '3. Information Sharing',
    content: `We share your information with: travel agents assigned to your booking (only necessary booking details); payment processors (Razorpay) to complete transactions; and analytics providers (Google Analytics) in anonymized form. We do not sell your personal information to third parties. We may disclose information if required by law or to protect our rights.`,
  },
  {
    title: '4. Cookies & Tracking',
    content: `We use cookies to maintain your session, remember preferences, and analyze usage. You can control cookies through your browser settings. Disabling cookies may affect certain features. We use Google Analytics to understand how visitors use our Platform — this data is aggregated and cannot identify you personally.`,
  },
  {
    title: '5. Data Security',
    content: `We implement industry-standard security measures including HTTPS encryption, secure password hashing (bcrypt), and access controls. Payment data is processed directly by Razorpay — we do not store card details on our servers. No system is 100% secure; in the event of a breach, we will notify affected users promptly.`,
  },
  {
    title: '6. Data Retention',
    content: `We retain your account data for as long as your account is active. Booking records are retained for 7 years for legal and tax compliance. You may request account deletion by contacting support — we will delete your data within 30 days, except where legal retention is required.`,
  },
  {
    title: '7. Your Rights',
    content: `Under Indian data protection law and GDPR (for EU residents), you have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; withdraw consent for marketing communications; and lodge complaints with the relevant data protection authority.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `TravelSphere is not directed to children under 18. We do not knowingly collect personal information from minors. If we become aware that a minor has created an account, we will delete their data promptly.`,
  },
  {
    title: '9. Third-Party Links',
    content: `Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to read the privacy policies of any external sites you visit.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the Platform. Continued use after changes indicates acceptance of the updated policy.`,
  },
  {
    title: '11. Contact Us',
    content: `For privacy-related questions or data requests, contact our Data Protection Officer at support@travelsphere.dev or +91 7992336832. Address: Law Gate, Phagwara, Punjab 144411, India.`,
  },
];

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-teal-100">Last updated: January 1, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            TravelSphere is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
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
              For more information, see our{' '}
              <Link to="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>
              {' '}or{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">Contact Us</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
