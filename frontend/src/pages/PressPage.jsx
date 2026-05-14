import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';

const pressItems = [
  {
    outlet: 'YourStory',
    date: 'March 2026',
    headline: 'TravelSphere: The Startup Making Curated Travel Accessible to Middle India',
    type: 'Feature',
  },
  {
    outlet: 'Economic Times',
    date: 'February 2026',
    headline: 'How TravelSphere is Using AI to Transform the ₹1.5 Trillion Indian Tourism Market',
    type: 'Interview',
  },
  {
    outlet: 'Inc42',
    date: 'January 2026',
    headline: 'Meet the Founders: TravelSphere\'s Journey from Weekend Project to Travel Platform',
    type: 'Feature',
  },
];

const brandAssets = [
  { name: 'TravelSphere Logo Pack (SVG, PNG)', size: '2.3 MB' },
  { name: 'Brand Guidelines PDF', size: '1.1 MB' },
  { name: 'Product Screenshots', size: '8.4 MB' },
  { name: 'Founders Photo', size: '3.2 MB' },
];

export function PressPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Press & Media</h1>
          <p className="text-teal-100 text-lg">TravelSphere in the news. For press enquiries, contact us directly.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Press contact */}
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-6 border border-teal-100 dark:border-teal-800 mb-12">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Press Enquiries</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">For interviews, quotes, or media kits, reach out to our press team.</p>
          <a href="mailto:press@travelsphere.dev" className="text-teal-600 font-medium hover:underline text-sm">press@travelsphere.dev</a>
        </div>

        {/* Coverage */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Recent Coverage</h2>
        <div className="space-y-4 mb-14">
          {pressItems.map((item) => (
            <div key={item.headline} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 hover:border-teal-200 dark:hover:border-teal-800 transition">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">{item.outlet}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{item.type}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.headline}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>

        {/* Brand assets */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Brand Assets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brandAssets.map((asset) => (
            <div key={asset.name} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{asset.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{asset.size}</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:underline">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-400 dark:text-slate-500 mt-8">
          TravelSphere brand assets may be used for editorial purposes only. For commercial use, please <Link to="/contact" className="text-teal-600 hover:underline">contact us</Link>.
        </p>
      </div>
    </div>
  );
}
