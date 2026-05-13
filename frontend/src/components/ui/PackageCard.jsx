import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, ImageOff } from 'lucide-react';
import { Badge } from './Badge';
import { getImageUrl } from '../../services/packageService';

export function PackageCard({ pkg, showDetails = false }) {
  const [imgError, setImgError] = useState(false);

  const formatPrice = (price) => {
    return `₹${parseInt(price).toLocaleString()}`;
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      group_tours: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700',
      personal_tours: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700',
      couple_tours: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700',
      family_tours: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700',
    };
    return colors[category] || colors.group_tours;
  };

  return (
    <Link to={`/packages/${pkg.id}`}>
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer h-full flex flex-col border border-teal-100/60 dark:border-dark-border">
        {/* Image */}
        <div className="relative overflow-hidden h-48 sm:h-56 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40">
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <ImageOff size={40} />
              <span className="text-xs mt-2">{pkg.destination}</span>
            </div>
          ) : (
            <img
              src={getImageUrl(pkg.bannerImage)}
              alt={pkg.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          )}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeColor(pkg.category)}`}>
              {pkg.category.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
            {pkg.title}
          </h3>

          {/* Location & Duration */}
          <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
            <MapPin size={14} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="line-clamp-1">{pkg.destination}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4 line-clamp-2 flex-1">
            {pkg.description}
          </p>

          {/* Features - if available */}
          {showDetails && pkg.itineraries && (
            <div className="mb-4 pb-4 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-dark-text-secondary mt-4">
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-amber-500" />
                  <span>{pkg.itineraries?.length || 0} Itineraries</span>
                </div>
              </div>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border mt-auto">
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
              <p className="text-xl font-bold text-teal-600 dark:text-teal-400">₹{parseInt(pkg.price).toLocaleString()}</p>
            </div>
            <span className="px-4 py-2 bg-teal-600 group-hover:bg-teal-700 text-white text-sm rounded-lg transition-colors font-medium">
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
