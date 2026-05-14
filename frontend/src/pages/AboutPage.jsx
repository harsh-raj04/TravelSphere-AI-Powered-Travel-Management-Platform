import { Link } from 'react-router-dom';
import { Users, Target, Heart, Globe, Award, MapPin } from 'lucide-react';

const stats = [
  { label: 'Happy Travelers', value: '1,000+' },
  { label: 'Destinations', value: '50+' },
  { label: 'Curated Packages', value: '200+' },
  { label: 'Years of Experience', value: '5+' },
];

const team = [
  { name: 'Harsh Raj', role: 'Founder & CEO', initials: 'HR' },
  { name: 'Priya Sharma', role: 'Head of Travel Curation', initials: 'PS' },
  { name: 'Arjun Mehta', role: 'Tech Lead', initials: 'AM' },
  { name: 'Sneha Kapoor', role: 'Customer Experience', initials: 'SK' },
];

const values = [
  { icon: Heart, title: 'Customer First', desc: 'Every decision we make starts with one question: how does this make travel better for our customers?' },
  { icon: Target, title: 'Curated Quality', desc: 'We handpick every package, verify every detail, and ensure every experience lives up to our promise.' },
  { icon: Globe, title: 'Authentic Experiences', desc: 'We believe travel should be immersive — connecting you with real culture, local guides, and genuine moments.' },
  { icon: Award, title: 'Transparent Pricing', desc: 'No hidden fees. What you see is what you pay. We publish full breakdowns for every package.' },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">About TravelSphere</h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto leading-relaxed">
            We're a team of passionate travelers on a mission to make extraordinary journeys accessible to everyone.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-teal-600">{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Our Story</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              TravelSphere was born from a simple frustration: planning a trip shouldn't require a travel agent degree. We noticed that independent travelers were stuck between generic package sites and the overwhelming complexity of DIY planning.
            </p>
            <p>
              Founded in 2021, we started with a handful of curated Himalayan packages and a small team of travel enthusiasts. Today, we cover 50+ destinations across India, offering everything from budget adventures to luxury retreats.
            </p>
            <p>
              Our platform connects verified travel agents with customers who want quality, transparency, and real support — not chatbots. Every package on TravelSphere is reviewed by our curation team before it goes live.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{v.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">{member.initials}</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{member.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Explore?</h2>
          <p className="text-teal-100 mb-6">Browse our curated packages and start planning your next adventure.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/packages" className="px-6 py-3 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition">
              Browse Packages
            </Link>
            <Link to="/contact" className="px-6 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
