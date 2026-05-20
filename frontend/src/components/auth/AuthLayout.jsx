import { useState, useEffect } from 'react';
import { MapPin, Plane } from 'lucide-react';

const DESTINATIONS = {
  login: [
    {
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
      title: 'Kashmir Paradise',
      subtitle: 'Heaven on Earth awaits you',
      location: 'Srinagar, Kashmir',
    },
    {
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=80',
      title: 'Tropical Bliss',
      subtitle: 'Sun, sand & endless adventures',
      location: 'Goa',
    },
    {
      image: 'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?auto=format&fit=crop&w=1920&q=80',
      title: 'Mountain Escapes',
      subtitle: 'Breathe in the Himalayan air',
      location: 'Manali, Himachal Pradesh',
    },
    {
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80',
      title: 'Backwater Bliss',
      subtitle: "God's own country awaits",
      location: 'Kerala',
    },
  ],
  signup: [
    {
      image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=1920&q=80',
      title: 'Start Your Journey',
      subtitle: 'Discover incredible destinations',
      location: 'Ladakh',
    },
    {
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed31f2a?auto=format&fit=crop&w=1920&q=80',
      title: 'Create Memories',
      subtitle: 'Experience royal Rajputana heritage',
      location: 'Rajasthan',
    },
    {
      image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1920&q=80',
      title: 'Find Your Paradise',
      subtitle: 'Crystal clear waters await',
      location: 'Andaman Islands',
    },
  ],
};

const STATS = [
  { value: '500+', label: 'Destinations' },
  { value: '10K+', label: 'Happy Travelers' },
  { value: '4.8★', label: 'Avg Rating' },
];

export function AuthLayout({ children, type = 'login' }) {
  const [current, setCurrent] = useState(0);
  const slides = DESTINATIONS[type];

  useEffect(() => {
    const id = setInterval(() => setCurrent(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: travel showcase (desktop only) ── */}
      <div className="hidden lg:block relative w-[52%] flex-shrink-0 overflow-hidden bg-slate-900">
        {/* Slides */}
        {slides.map((d, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <img
              src={d.image}
              alt={d.title}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/55 via-slate-900/40 to-slate-950/85 z-10" />

        {/* Branding top-left */}
        <div className="absolute top-8 left-10 z-20 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TravelSphere</span>
        </div>

        {/* Stats */}
        <div className="absolute top-8 right-10 z-20 flex gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-white text-right">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-white/65 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Slide content */}
        <div className="absolute bottom-24 left-10 right-10 z-20 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {slides[current].location}
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-3">{slides[current].title}</h2>
          <p className="text-xl text-white/80">{slides[current].subtitle}</p>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-10 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white w-10' : 'bg-white/35 w-5 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
