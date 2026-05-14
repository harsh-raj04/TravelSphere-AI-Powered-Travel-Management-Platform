import { Link } from 'react-router-dom';
import { MapPin, Clock, ExternalLink } from 'lucide-react';

const openings = [
  { title: 'Senior Frontend Developer', dept: 'Engineering', location: 'Remote / Phagwara', type: 'Full-time' },
  { title: 'Travel Curation Specialist', dept: 'Operations', location: 'Phagwara, Punjab', type: 'Full-time' },
  { title: 'Customer Success Manager', dept: 'Support', location: 'Remote', type: 'Full-time' },
  { title: 'Marketing & Growth Lead', dept: 'Marketing', location: 'Remote / Noida', type: 'Full-time' },
  { title: 'Travel Photographer (Freelance)', dept: 'Creative', location: 'Various Locations', type: 'Freelance' },
];

const perks = [
  { emoji: '🌍', title: 'Travel Allowance', desc: 'Annual travel credit to explore our destinations first-hand.' },
  { emoji: '🏡', title: 'Remote-Friendly', desc: 'Most roles can be done from anywhere in India.' },
  { emoji: '📚', title: 'Learning Budget', desc: '₹20,000/year for courses, books, and conferences.' },
  { emoji: '💪', title: 'Health Insurance', desc: 'Comprehensive health coverage for you and your family.' },
  { emoji: '🎯', title: 'Equity Options', desc: 'Early employees get meaningful ownership in TravelSphere.' },
  { emoji: '🎉', title: 'Team Retreats', desc: 'Quarterly team trips to our featured destinations.' },
];

export function CareersPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
            Help us build the travel platform that millions of Indians deserve. We're a small, passionate team moving fast.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Values */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 mb-14">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Why TravelSphere?</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            We're building something real — a platform that helps regular Indians experience extraordinary journeys without the confusion and expense of traditional travel agencies. If you want your work to have a direct impact and you love travel, you'll fit right in.
          </p>
        </div>

        {/* Perks */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Perks & Benefits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {perks.map((perk) => (
            <div key={perk.title} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl mb-2">{perk.emoji}</div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{perk.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{perk.desc}</p>
            </div>
          ))}
        </div>

        {/* Open roles */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Open Positions</h2>
        <div className="space-y-3 mb-12">
          {openings.map((role) => (
            <div key={role.title} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-teal-300 dark:hover:border-teal-700 transition group">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition">{role.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-teal-600 font-medium">{role.dept}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" /> {role.location}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" /> {role.type}</span>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline flex-shrink-0">
                Apply <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-8 border border-teal-100 dark:border-teal-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Don't see your role?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-5 text-sm">We're always looking for exceptional people. Send us your resume and tell us how you'd contribute.</p>
          <a href="mailto:careers@travelsphere.dev" className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition text-sm">
            Send Your Resume
          </a>
        </div>
      </div>
    </div>
  );
}
