import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Star, Zap, ImageOff } from 'lucide-react';
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
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden h-64 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40">
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <ImageOff size={40} />
              <span className="text-xs mt-2">{pkg.destination}</span>
            </div>
          ) : (
            <img
              src={getImageUrl(pkg.bannerImage)}
              alt={pkg.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          )}
          <div className="absolute top-4 right-4">
            <Badge variant="primary" className="bg-brand-primary text-white">
              ₹{parseInt(pkg.price).toLocaleString()}
            </Badge>
          </div>
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeColor(pkg.category)}`}>
              {pkg.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
            {pkg.title}
          </h3>

          {/* Location & Duration */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={16} className="text-brand-primary" />
              <span className="text-sm line-clamp-1">{pkg.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={16} className="text-brand-primary" />
              <span className="text-sm">{pkg.durationDays} Days</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
            {pkg.description}
          </p>

          {/* Features - if available */}
          {showDetails && pkg.itineraries && (
            <div className="mb-4 pb-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-4">
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-amber-500" />
                  <span>{pkg.itineraries?.length || 0} Itineraries</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn">
            View Details
            <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
