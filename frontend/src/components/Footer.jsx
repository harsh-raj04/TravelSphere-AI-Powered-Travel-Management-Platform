import { Globe, Send, Camera, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              Explore the world through verified travel experiences.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-teal-400 hover:text-teal-300 transition">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-teal-400 hover:text-teal-300 transition">
                <Send className="w-5 h-5" />
              </a>
              <a href="#" className="text-teal-400 hover:text-teal-300 transition">
                <Camera className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-teal-300 transition">About Us</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">Careers</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">Press</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-teal-300 transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">FAQ</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">Terms</a></li>
              <li><a href="#" className="hover:text-teal-300 transition">Privacy</a></li>
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

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-center text-sm text-slate-500">
            © 2026 TravelSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
