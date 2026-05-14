import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const faqData = [
  {
    category: 'Booking',
    items: [
      {
        q: 'How do I book a travel package?',
        a: 'Browse our packages, select the one you like, choose your travel dates and number of travelers, then click "Book Now". You\'ll be taken through a secure checkout process. We accept all major credit/debit cards and UPI.',
      },
      {
        q: 'Can I book a package for a group?',
        a: 'Yes! When selecting your package, you can specify the number of travelers. For groups of 10 or more, we recommend using the "Customize Package" option for special group rates.',
      },
      {
        q: 'Is my booking confirmed immediately?',
        a: 'Most packages are confirmed instantly after payment. For customized packages or peak season bookings, confirmation may take up to 24 hours. You\'ll receive an email with your booking details.',
      },
      {
        q: 'Can I book without creating an account?',
        a: 'An account is required to book. Registration is quick and free — it lets you track your bookings, receive updates, and access your booking history anytime.',
      },
    ],
  },
  {
    category: 'Payments & Pricing',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept credit cards (Visa, Mastercard, American Express), debit cards, UPI (PhonePe, Google Pay, Paytm), and net banking. All payments are processed securely via Razorpay.',
      },
      {
        q: 'Are there any hidden charges?',
        a: 'No hidden fees. The price shown on each package includes all mentioned inclusions. Any optional add-ons are clearly listed separately before you confirm your booking.',
      },
      {
        q: 'Is GST included in the package price?',
        a: 'GST (5% for most travel services) is included in the displayed package price. Your booking invoice will show the GST breakdown for your records.',
      },
      {
        q: 'Do you offer EMI options?',
        a: 'EMI options are available on select credit cards for bookings above ₹10,000. The EMI option appears at checkout if your card is eligible.',
      },
    ],
  },
  {
    category: 'Cancellation & Refunds',
    items: [
      {
        q: 'What is your cancellation policy?',
        a: 'Cancellation charges depend on how close to the travel date you cancel: 30+ days before — 10% charge; 15–30 days — 25% charge; 7–15 days — 50% charge; less than 7 days — no refund. Some packages have different terms — check the package details.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Approved refunds are processed within 5–7 business days. The amount will be credited to your original payment method. UPI refunds are typically faster (2–3 days).',
      },
      {
        q: 'Can I reschedule my trip instead of cancelling?',
        a: 'Yes, rescheduling is available subject to availability. Rescheduling more than 15 days before travel is usually free; within 15 days, a ₹500 rescheduling fee may apply.',
      },
    ],
  },
  {
    category: 'Packages & Customization',
    items: [
      {
        q: 'Can I customize a package?',
        a: 'Absolutely! Use our "Customize Package" feature to specify your destination, dates, group size, budget, and preferences. One of our travel experts will create a tailored itinerary within 24 hours.',
      },
      {
        q: 'Are the package itineraries fixed?',
        a: 'Standard packages have fixed itineraries, but many can be adjusted slightly. If you need significant changes, use the Custom Package Request feature.',
      },
      {
        q: 'Do packages include flights?',
        a: 'Most packages are land-only (surface transport included). Packages that include flights clearly mention it in the inclusions. We can add flight booking as an add-on for select packages.',
      },
    ],
  },
  {
    category: 'Account & Support',
    items: [
      {
        q: 'How do I track my booking?',
        a: 'Log into your account and go to "My Bookings". You\'ll see real-time status updates for your booking, including confirmation, agent assignment, and payment details.',
      },
      {
        q: 'What if I face issues during my trip?',
        a: 'Our support team is available Mon–Sat, 9AM–7PM IST. For urgent issues during travel, WhatsApp us at +91 7992336832 — we aim to respond within 30 minutes.',
      },
      {
        q: 'How do I change my account details?',
        a: 'Go to your Profile page and click "Edit Profile". You can update your name, phone number, and email. A verification OTP will be sent for email changes.',
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
      >
        <span className="font-medium text-slate-900 dark:text-slate-100 pr-4 text-sm">{q}</span>
        <ChevronDown className={`w-5 h-5 text-teal-600 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
          {a}
        </div>
      )}
    </div>
  );
}

export function FaqPage() {
  const [search, setSearch] = useState('');

  const filtered = faqData.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-teal-100 mb-8">Find quick answers to common questions about booking, payments, and more.</p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-teal-200 outline-none focus:border-white/50 transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-200" />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No results found for "{search}"</p>
            <button onClick={() => setSearch('')} className="text-sm text-teal-600 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <div key={cat.category}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-teal-500 rounded-full inline-block" />
                  {cat.category}
                </h2>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still have questions */}
        <div className="mt-16 text-center bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Still have questions?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Our support team is ready to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <RouterLink to="/contact" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition text-sm">
              Contact Support
            </RouterLink>
            <a href="https://wa.me/917992336832" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 border border-teal-600 text-teal-600 font-medium rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition text-sm">
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
