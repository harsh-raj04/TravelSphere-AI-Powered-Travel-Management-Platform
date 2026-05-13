import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';

/**
 * Generic "Coming Soon" placeholder for agent panel pages.
 * Usage: <AgentComingSoon title="Settings" description="..." />
 */
export function AgentComingSoon({ title, description, icon: Icon = Wrench }) {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>

      {/* Coming soon card */}
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-teal-50 border-2 border-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon className="w-9 h-9 text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          We are actively building the <span className="font-semibold text-teal-600">{title}</span>{' '}
          feature. It will be available in a future update.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
