import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function ComingSoonPage({ title = 'Coming Soon', subtitle = 'We\'re working hard to bring you something amazing. Stay tuned!' }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/packages" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition text-sm">
            Browse Packages
          </Link>
          <Link to="/" className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
