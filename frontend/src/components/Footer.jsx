import { Globe, Send, Camera, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';
      const res = await fetch(`${BACKEND}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(data.message || 'You\'re subscribed!');
        setEmail('');
      } else {
        setStatus('error');
        setMsg(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  }

  return (
    <div className="border-t border-white/10 py-8">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="text-lg font-semibold text-white mb-1">Stay Updated with Latest Deals</h3>
        <p className="text-sm text-slate-400 mb-4">Join 10,000+ travelers — get exclusive offers and travel tips.</p>
        {status === 'success' ? (
          <p className="text-teal-400 text-sm font-medium">{msg}</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-500 outline-none focus:border-teal-400 transition"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
            >
              {status === 'loading' ? 'Subscribing...' : (
                <><span>Subscribe</span><ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>
        )}
        {status === 'error' && <p className="text-red-400 text-xs mt-2">{msg}</p>}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="font-bold text-white">TravelSphere</span>
            </div>
            <p className="text-sm text-slate-400 mb-4 max-w-xs leading-6">
              Explore the world through verified travel experiences. Curated packages, AI-powered trip planning, and a community of explorers.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-teal-400 hover:text-teal-300 transition">
                <Globe className="w-5 h-5" />
              </a>
              <a href="https://t.me/travelsphere" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="text-teal-400 hover:text-teal-300 transition">
                <Send className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-teal-400 hover:text-teal-300 transition">
                <Camera className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-teal-300 transition">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-teal-300 transition">Careers</Link></li>
              <li><Link to="/press" className="hover:text-teal-300 transition">Press</Link></li>
              <li><Link to="/blog" className="hover:text-teal-300 transition">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/contact" className="hover:text-teal-300 transition">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-teal-300 transition">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-teal-300 transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-teal-300 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href="mailto:support@travelsphere.dev" className="hover:text-teal-300 transition">
                  support@travelsphere.dev
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href="tel:+917992336832" className="hover:text-teal-300 transition">
                  +91 7992336832
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <span>Law Gate, Phagwara, Punjab, 144411, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <NewsletterForm />

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            © 2026 TravelSphere. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link to="/terms" className="hover:text-slate-400 transition">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
            <Link to="/contact" className="hover:text-slate-400 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
