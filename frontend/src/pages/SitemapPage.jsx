import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';

const sections = [
  {
    title: 'Main Pages',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Explore Packages', to: '/packages' },
      { label: 'Customize My Package', to: '/customize-package' },
      { label: 'AI Trip Planner', to: '/trip-planner' },
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'Browse by Category',
    links: [
      { label: 'Group Tours', to: '/packages?categories=group_tours' },
      { label: 'Family Tours', to: '/packages?categories=family_tours' },
      { label: 'Weekend Trips', to: '/packages?categories=weekend_trips' },
      { label: 'Pilgrimage Tours', to: '/packages?categories=pilgrimage' },
      { label: 'Solo Tours', to: '/packages?categories=personal_tours' },
      { label: 'Honeymoon Packages', to: '/packages?categories=couple_tours' },
    ],
  },
  {
    title: 'Browse by Style',
    links: [
      { label: 'Beach Holidays', to: '/packages?tripStyle=beach' },
      { label: 'Mountain Escapes', to: '/packages?tripStyle=mountain' },
      { label: 'Adventure Trips', to: '/packages?tripStyle=adventure' },
      { label: 'Calm & Wellness', to: '/packages?tripStyle=calm' },
      { label: 'Heritage & Culture', to: '/packages?tripStyle=heritage' },
    ],
  },
  {
    title: 'Customer Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Register', to: '/register' },
      { label: 'My Dashboard', to: '/home' },
      { label: 'My Bookings', to: '/bookings' },
      { label: 'My Profile', to: '/profile' },
      { label: 'My Requests', to: '/my-account/requests' },
      { label: 'Support Center', to: '/support' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Public Chat', to: '/community/public-chat' },
      { label: 'Manali Room', to: '/community/location/manali' },
      { label: 'Kashmir Room', to: '/community/location/kashmir' },
      { label: 'Goa Room', to: '/community/location/goa' },
      { label: 'Kerala Room', to: '/community/location/kerala' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About TravelSphere', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Sitemap', to: '/sitemap' },
    ],
  },
];

export function SitemapPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      <section className="bg-gradient-to-br from-teal-800 to-teal-600 py-16 px-4 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
            <Map className="w-4 h-4 text-teal-200" />
            <span className="text-sm font-medium text-teal-100">Sitemap</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Everything in One Place</h1>
          <p className="text-teal-200 text-lg">A complete index of all pages on TravelSphere.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4">
                {sec.title}
              </h2>
              <ul className="space-y-2">
                {sec.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 text-sm flex items-center gap-1.5 group transition-colors"
                    >
                      <span className="w-1 h-1 bg-teal-400 rounded-full group-hover:bg-teal-600 transition-colors flex-shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
