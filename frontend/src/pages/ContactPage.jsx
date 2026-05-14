import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';

const contactMethods = [
  {
    icon: Phone,
    title: 'Call Us',
    desc: 'Mon–Sat, 9AM–7PM IST',
    value: '+91 7992336832',
    href: 'tel:+917992336832',
  },
  {
    icon: Mail,
    title: 'Email Us',
    desc: 'We reply within 24 hours',
    value: 'support@travelsphere.dev',
    href: 'mailto:support@travelsphere.dev',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    desc: 'Quick responses',
    value: '+91 7992336832',
    href: 'https://wa.me/917992336832',
  },
  {
    icon: MapPin,
    title: 'Office',
    desc: 'Visit us in person',
    value: 'Law Gate, Phagwara, Punjab 144411',
    href: null,
  },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    // Placeholder — wire to support ticket endpoint in Phase 3
    await new Promise((r) => setTimeout(r, 800));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-teal-100 text-lg">We'd love to hear from you. Reach out and we'll get back to you as soon as possible.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact methods */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">Get in Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                const content = (
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
                    <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{method.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{method.desc}</p>
                    <p className="text-sm font-medium text-teal-600">{method.value}</p>
                  </div>
                );
                return method.href ? (
                  <a key={method.title} href={method.href} target={method.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <div key={method.title}>{content}</div>
                );
              })}
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-5 border border-teal-100 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Business Hours</h3>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li className="flex justify-between"><span>Monday – Friday</span><span>9:00 AM – 7:00 PM IST</span></li>
                <li className="flex justify-between"><span>Saturday</span><span>10:00 AM – 5:00 PM IST</span></li>
                <li className="flex justify-between"><span>Sunday</span><span>Closed</span></li>
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Send a Message</h2>
            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Message Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">We'll get back to you within 24 hours.</p>
                <button onClick={() => setStatus('idle')} className="text-sm text-teal-600 hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Rahul Gupta"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="rahul@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell us more about your query..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
