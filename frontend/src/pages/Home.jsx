import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, MapPin, Phone, Loader2,
  Search, Star, ArrowRight, ChevronDown, X, Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { packageService, getImageUrl } from '../services/packageService';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

const BUDGET_RANGES = [
  { id: '0-10000',     label: 'Under ₹10,000',   shortLabel: 'Under ₹10k',   desc: 'Budget-friendly', icon: '💵', min: 0,     max: 10000 },
  { id: '10000-25000', label: '₹10,000 – ₹25,000', shortLabel: '₹10k–₹25k',  desc: 'Mid-range comfort', icon: '💳', min: 10000, max: 25000 },
  { id: '25000-50000', label: '₹25,000 – ₹50,000', shortLabel: '₹25k–₹50k',  desc: 'Premium experience', icon: '💎', min: 25000, max: 50000 },
  { id: '50000-above', label: 'Above ₹50,000',    shortLabel: 'Luxury ₹50k+', desc: 'Luxury travel',      icon: '👑', min: 50000, max: null },
];

const TRIP_CATEGORIES = [
  { id: 'group_tours',   label: 'Group Tours',    icon: '👥', desc: 'Travel with fellow explorers' },
  { id: 'family_tours',  label: 'Family Tours',   icon: '👨‍👩‍👧‍👦', desc: 'Perfect for families' },
  { id: 'weekend_trips', label: 'Weekend Trips',  icon: '🌴', desc: 'Short getaways' },
  { id: 'pilgrimage',    label: 'Pilgrimage',     icon: '🕌', desc: 'Spiritual journeys' },
  { id: 'personal_tours',label: 'Solo Tours',     icon: '👤', desc: 'Personalized experience' },
  { id: 'couple_tours',  label: 'Honeymoon',      icon: '💑', desc: 'Romantic escapes' },
];

// ── Destinations Carousel ─────────────────────────────────────────────────────
function DestinationsCarousel({ destinations }) {
  const scrollRef = useRef(null);

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  }

  return (
    <section className="py-20 bg-teal-50/50 dark:bg-dark-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 tracking-tight">
              Top Destinations
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Most loved destinations by our travellers</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => scroll('left')} aria-label="Scroll left"
              className="p-3 rounded-full bg-white dark:bg-dark-bg-secondary border border-teal-200 dark:border-dark-border text-teal-600 hover:bg-teal-50 dark:hover:bg-dark-bg shadow-sm transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => scroll('right')} aria-label="Scroll right"
              className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {destinations.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
        ) : (
          <div ref={scrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
            style={{ scrollSnapType: 'x mandatory' }}>
            {destinations.map((dest) => (
              <Link key={dest.name} to={`/packages?destinations=${dest.name}`}
                className="group flex-shrink-0 w-[260px] sm:w-[300px]" style={{ scrollSnapAlign: 'start' }}>
                <div className="relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <img src={dest.image} alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl tracking-tight">{dest.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Multi-select Dropdown field ───────────────────────────────────────────────
function MultiSelectField({ icon, label, placeholder, options, selected, onChange, searchable, renderOption, getLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = query
    ? options.filter(o => (getLabel(o) || '').toLowerCase().includes(query.toLowerCase()))
    : options;

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1 ? getLabel(options.find(o => o.id === selected[0]) || { id: selected[0], label: selected[0] })
    : `${selected.length} selected`;

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 bg-white dark:bg-slate-800 text-left transition-all ${
          open ? 'border-teal-500 shadow-lg shadow-teal-100 dark:shadow-none' : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'
        }`}
      >
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
          <p className={`text-sm font-medium truncate ${selected.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {displayText}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected chips under field */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 px-1">
          {selected.map(id => {
            const opt = options.find(o => o.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-600 text-white rounded-full text-xs font-medium">
                {getLabel(opt || { id, label: id })}
                <button type="button" onClick={() => toggle(id)} className="hover:text-red-200 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'slideDown 0.18s ease-out', maxHeight: '340px' }}>
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
            {/* All option */}
            <button type="button"
              onClick={() => onChange([])}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                selected.length === 0 ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-medium' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                selected.length === 0 ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selected.length === 0 && <Check className="w-3 h-3 text-white" />}
              </span>
              All {label}
            </button>

            {filtered.map(opt => {
              const isSelected = selected.includes(opt.id);
              return (
                <button key={opt.id} type="button"
                  onClick={() => toggle(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isSelected ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                    isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  {renderOption ? renderOption(opt) : (
                    <span className="flex items-center justify-between w-full">
                      <span>{getLabel(opt)}</span>
                      {opt.count !== undefined && <span className="text-xs text-slate-400 ml-auto">{opt.count}</span>}
                    </span>
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">No results found</p>
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-2">
              <button type="button" onClick={() => onChange([])}
                className="w-full text-xs text-red-500 hover:text-red-600 py-1.5 transition-colors font-medium">
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Search Box ────────────────────────────────────────────────────────────────
function SearchBox({ destinations }) {
  const navigate = useNavigate();
  const [selDest, setSelDest] = useState([]);
  const [selBudgets, setSelBudgets] = useState([]);
  const [selCats, setSelCats] = useState([]);

  const destOptions = destinations.map(d => ({ id: d.name, label: d.name }));

  function handleSearch() {
    const params = new URLSearchParams();
    if (selDest.length) params.set('destinations', selDest.join(','));
    if (selBudgets.length) params.set('budgets', selBudgets.join(','));
    if (selCats.length) params.set('categories', selCats.join(','));
    navigate(`/packages?${params.toString()}`);
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-7 shadow-2xl">
      <p className="text-white/90 text-sm font-semibold text-center mb-4 tracking-wide uppercase">Find Your Perfect Adventure</p>

      <div className="flex flex-col lg:flex-row gap-3">
        <MultiSelectField
          icon="📍"
          label="Destination"
          placeholder="All destinations"
          options={destOptions}
          selected={selDest}
          onChange={setSelDest}
          searchable
          getLabel={o => o.label || o.id}
          renderOption={o => <span>{o.label}</span>}
        />

        <MultiSelectField
          icon="💰"
          label="Budget"
          placeholder="All budgets"
          options={BUDGET_RANGES}
          selected={selBudgets}
          onChange={setSelBudgets}
          searchable={false}
          getLabel={o => o.shortLabel || o.label}
          renderOption={o => (
            <span className="flex items-center gap-2.5 w-full">
              <span className="text-base">{o.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium leading-none">{o.label}</span>
                <span className="block text-xs text-slate-400 mt-0.5">{o.desc}</span>
              </span>
            </span>
          )}
        />

        <MultiSelectField
          icon="🎯"
          label="Trip Type"
          placeholder="All types"
          options={TRIP_CATEGORIES}
          selected={selCats}
          onChange={setSelCats}
          searchable={false}
          getLabel={o => o.label}
          renderOption={o => (
            <span className="flex items-center gap-2.5 w-full">
              <span className="text-base">{o.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium leading-none">{o.label}</span>
                <span className="block text-xs text-slate-400 mt-0.5">{o.desc}</span>
              </span>
            </span>
          )}
        />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40"
      >
        <Search className="w-4 h-4" />
        Search Packages →
      </button>
    </div>
  );
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────
function HeroCarousel({ featuredPackages, destinations }) {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});
  const total = featuredPackages.length;
  const timerRef = useRef(null);

  function resetTimer() {
    clearInterval(timerRef.current);
    if (total >= 2) timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 6000);
  }

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [total]);

  function goTo(i) { setCurrent(i); resetTimer(); }
  function prev() { goTo((current - 1 + total) % total); }
  function next() { goTo((current + 1) % total); }

  const pkg = featuredPackages[current];

  return (
    /* teal gradient is the immediate background — no black flash, no wait */
    <section
      className="relative"
      style={{
        minHeight: '92vh',
        background: 'linear-gradient(135deg, #064E48 0%, #0F766E 50%, #0D9488 100%)',
      }}
    >
      {/* Background image layer — overflow-hidden only here */}
      <div className="absolute inset-0 overflow-hidden">
        {featuredPackages.map((p, i) => (
          <div
            key={p.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <img
              key={`img-${p.id}-${i === current ? 'on' : 'off'}`}
              src={getImageUrl(p.bannerImage)}
              alt={p.title}
              className="w-full h-full object-cover"
              style={{
                opacity: loadedImages[p.id] ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                ...(i === current ? { animation: 'kenBurns 8s ease-in-out forwards' } : {}),
              }}
              onLoad={() => setLoadedImages(prev => ({ ...prev, [p.id]: true }))}
            />
          </div>
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.82) 100%)',
        }} />
      </div>

      {/* Content — above the background */}
      <div className="relative z-20 flex flex-col" style={{ minHeight: '92vh' }}>
        {/* Package info overlay — top left */}
        {pkg && (
          <div className="absolute top-24 left-4 sm:left-8 max-w-xs">
            <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  TRENDING
                </span>
                {pkg.featuredRank && (
                  <span className="text-xs text-white/70">#{pkg.featuredRank} Featured</span>
                )}
              </div>
              <h2 className="text-lg font-bold leading-snug mb-1">{pkg.title}</h2>
              <p className="text-white/70 text-sm mb-3">
                {pkg.durationDays} Day{pkg.durationDays !== 1 ? 's' : ''} · {pkg.destination}
              </p>
              <p className="text-2xl font-bold text-teal-300 mb-3">
                ₹{Number(pkg.price).toLocaleString('en-IN')}
                <span className="text-sm font-normal text-white/60 ml-1">/person</span>
              </p>
              {pkg.rating && (
                <p className="flex items-center gap-1 text-amber-400 text-sm mb-4">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-semibold">{pkg.rating.toFixed(1)}</span>
                </p>
              )}
              <Link to={`/packages/${pkg.id}`}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                Book Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Centered headline */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight drop-shadow-lg">
            Discover Your Next
            <span className="block text-teal-300">Great Adventure</span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl">
            Explore handcrafted tour packages across India. From serene mountains to sun-kissed beaches.
          </p>
        </div>

        {/* Slide controls & Search Box — bottom */}
        <div className="px-4 sm:px-8 pb-8 space-y-5">
          {/* Dots + arrows */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={prev} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                {featuredPackages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${i === current ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}
                  />
                ))}
              </div>
              <button onClick={next} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="max-w-5xl mx-auto w-full">
            <SearchBox destinations={destinations} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Home Page ────────────────────────────────────────────────────────────
export function Home() {
  const [packages, setPackages] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePackageTab, setActivePackageTab] = useState('all');
  const featuredScrollRef = useRef(null);

  const destinationImages = {
    'Shimla':     `${BACKEND_ORIGIN}/images/packages/shimla-heritage-trail.jpg`,
    'Goa':        `${BACKEND_ORIGIN}/images/packages/goa-beach-paradise.jpg`,
    'Manali':     `${BACKEND_ORIGIN}/images/packages/manali-snow-adventure.jpg`,
    'Kedarnath':  `${BACKEND_ORIGIN}/images/packages/kedarnath-dham-yatra.jpg`,
    'Kerala':     `${BACKEND_ORIGIN}/images/packages/kerala-backwaters.jpg`,
    'Rajasthan':  `${BACKEND_ORIGIN}/images/packages/royal-rajasthan.jpg`,
    'Kashmir':    `${BACKEND_ORIGIN}/images/packages/kashmir-paradise.jpg`,
    'Andaman':    `${BACKEND_ORIGIN}/images/packages/andaman-island-hopping.jpg`,
    'Leh Ladakh': `${BACKEND_ORIGIN}/images/packages/leh-ladakh-road-trip.jpg`,
    'Rishikesh':  `${BACKEND_ORIGIN}/images/packages/rishikesh-adventure.jpg`,
  };

  useEffect(() => {
    Promise.all([
      packageService.getFeaturedPackages().then(data => setFeaturedPackages(data || [])).catch(() => {}),
      packageService.getAll().then(data => setPackages(data)).catch(() => {}).finally(() => setLoading(false)),
      packageService.getDestinationCounts().then(counts => {
        setDestinations(counts.map(item => ({
          name: item.destination,
          count: item.count,
          image: destinationImages[item.destination] || '',
        })));
      }).catch(() => {}),
    ]);
  }, []);

  const packageTabs = [
    { id: 'all', label: 'All Packages' },
    { id: 'group_tours', label: 'Group Tours' },
    { id: 'family_tours', label: 'Family Tours' },
    { id: 'pilgrimage', label: 'Pilgrimage' },
    { id: 'weekend_trips', label: 'Weekend Trips' },
  ];

  const filteredTabPackages = activePackageTab === 'all'
    ? packages
    : packages.filter(pkg => pkg.category === activePackageTab);

  const browseCategories = [
    { icon: '🏖️', name: 'Beach',     desc: 'Coastal escapes',       slug: 'beach' },
    { icon: '⛰️', name: 'Mountains', desc: 'Alpine adventures',      slug: 'mountain' },
    { icon: '🌊', name: 'Adventure', desc: 'Thrilling activities',   slug: 'adventure' },
    { icon: '🧘', name: 'Calm',      desc: 'Wellness & relaxation',  slug: 'calm' },
    { icon: '🏛️', name: 'Heritage',  desc: 'Culture & history',      slug: 'heritage' },
  ];

  return (
    <div className="travel-ui">
      {/* ── Hero with Carousel ── */}
      <HeroCarousel featuredPackages={featuredPackages} destinations={destinations} />

      {/* ── Featured Packages ── */}
      <section className="py-20 bg-teal-50/50 dark:bg-dark-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 relative">
            <h2 className="text-3xl sm:text-4xl font-serif italic text-gray-900 dark:text-dark-text-primary mb-2">
              Our Best Offers
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Handpicked experiences for unforgettable journeys</p>
            {/* Scroll arrows — absolute right */}
            <div className="absolute right-0 top-0 flex gap-2">
              <button
                onClick={() => featuredScrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                className="p-3 rounded-full bg-white dark:bg-dark-bg-secondary border border-teal-200 dark:border-dark-border text-teal-600 hover:bg-teal-50 dark:hover:bg-dark-bg shadow-sm transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => featuredScrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
          ) : (
            <div ref={featuredScrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
              style={{ scrollSnapType: 'x mandatory' }}>
              {featuredPackages.map((pkg) => (
                <Link key={pkg.id} to={`/packages/${pkg.id}`}
                  className="flex-shrink-0 w-[300px] sm:w-[340px] group" style={{ scrollSnapAlign: 'start' }}>
                  <Card hover className="h-full overflow-hidden rounded-2xl">
                    <div className="relative h-48 overflow-hidden">
                      <img src={getImageUrl(pkg.bannerImage)} alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <Badge variant="accent" className="absolute top-3 left-3">
                        Featured #{pkg.featuredRank}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg mb-1">{pkg.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
                        <MapPin className="w-4 h-4" />{pkg.destination}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
                          <p className="text-xl font-bold text-teal-600">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                        </div>
                        <Link to={`/packages/${pkg.id}`}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors">
                          View
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Browse by Category ── */}
      <section className="py-20 bg-white dark:bg-dark-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
              Browse by Category
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Find the perfect trip that matches your travel style</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {browseCategories.map((cat) => (
              <Link key={cat.name} to={`/packages?tripStyle=${cat.slug}`}>
                <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 py-8 text-center">
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Destinations ── */}
      <DestinationsCarousel destinations={destinations} />

      {/* ── Package Tabs ── */}
      <section className="py-20 bg-white dark:bg-dark-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
              Explore Our Packages
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Find the perfect package for your next getaway</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {packageTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActivePackageTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activePackageTab === tab.id
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-secondary hover:bg-teal-100 dark:hover:bg-dark-border'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
          ) : filteredTabPackages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">
              No packages found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTabPackages.slice(0, 6).map((pkg) => (
                <Link key={pkg.id} to={`/packages/${pkg.id}`} className="group block h-full">
                  <div className="h-full bg-white dark:bg-dark-bg-secondary rounded-2xl overflow-hidden border border-teal-100/60 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img src={getImageUrl(pkg.bannerImage)} alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <Badge variant="accent" className="absolute top-3 left-3">{pkg.durationDays} Days</Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg mb-2 tracking-tight">{pkg.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
                        <MapPin className="w-4 h-4" />{pkg.destination}
                      </div>
                      <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-4 line-clamp-2">{pkg.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-teal-100/60 dark:border-dark-border">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
                          <p className="text-xl font-bold text-teal-600">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                        </div>
                        <span className="px-4 py-2 bg-teal-600 group-hover:bg-teal-700 text-white text-sm rounded-lg transition-colors">Explore</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/packages"><Button variant="pill" size="lg">View All Packages</Button></Link>
          </div>
        </div>
      </section>

      {/* ── Contact Section ── */}
      <section className="py-20 bg-teal-900 dark:bg-dark-bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Get In Touch</h2>
            <p className="text-teal-200">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="!bg-white/10 !backdrop-blur-sm !border-teal-700 text-white rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-600 rounded-xl"><MapPin className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Our Address</h3>
                  <p className="text-teal-100 text-sm leading-relaxed">Law Gate, Phagwara<br />Punjab, 144411<br />India</p>
                </div>
              </div>
            </Card>
            <Card className="!bg-white/10 !backdrop-blur-sm !border-teal-700 text-white rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-600 rounded-xl"><Phone className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Call Us</h3>
                  <p className="text-teal-100 text-sm">+91 7992336832</p>
                  <p className="text-teal-200 text-xs mt-1">Available Mon-Sat, 9 AM - 7 PM</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-20 bg-teal-50 dark:bg-dark-bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
            Stay Updated
          </h2>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-8">
            Subscribe to our newsletter for exclusive deals and travel inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" placeholder="Enter your email"
              className="flex-1 px-5 py-3 rounded-xl border border-teal-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <Button variant="primary" className="rounded-xl px-6">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
