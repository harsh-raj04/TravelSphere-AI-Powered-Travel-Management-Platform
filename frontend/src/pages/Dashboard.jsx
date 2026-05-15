import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, packagesAPI } from '../services/api';
import { getImageUrl } from '../services/packageService';
import {
  Plane, Camera, Calendar, Heart, ArrowRight, MapPin, Clock,
  Sparkles, Wand2, Users, Compass, Star, Mountain, Sun, Leaf,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSeasonDestinations() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { season: 'Spring', emoji: '🌸', places: ['Shimla', 'Manali', 'Darjeeling'] };
  if (month >= 5 && month <= 7) return { season: 'Monsoon', emoji: '🌧️', places: ['Kerala', 'Coorg', 'Meghalaya'] };
  if (month >= 8 && month <= 10) return { season: 'Autumn', emoji: '🍂', places: ['Rajasthan', 'Ladakh', 'Kashmir'] };
  return { season: 'Winter', emoji: '❄️', places: ['Goa', 'Kerala', 'Andaman'] };
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, gradient, delay = 0 }) {
  return (
    <div
      className="group bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

// ─── Quick Action Tile ─────────────────────────────────────────────────────

function ActionTile({ to, icon: Icon, title, subtitle, gradient }) {
  return (
    <Link
      to={to}
      className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-5 overflow-hidden hover:scale-[1.03] hover:rotate-[0.5deg] transition-all duration-200 shadow-md hover:shadow-xl`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-white font-semibold text-sm leading-tight">{title}</p>
      <p className="text-white/75 text-xs mt-0.5">{subtitle}</p>
    </Link>
  );
}

// ─── Upcoming Trip Card ────────────────────────────────────────────────────

function UpcomingTripCard({ booking }) {
  const days = daysUntil(booking.travelDate);
  const imgSrc = getImageUrl(booking.package?.bannerImage);
  const destination = booking.package?.destination || booking.package?.title || 'Your Trip';

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgSrc}
          alt={destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Countdown badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${days <= 7 ? 'bg-red-500' : days <= 30 ? 'bg-amber-500' : 'bg-teal-600'}`}>
          {days > 0 ? `${days} days to go` : 'Today!'}
        </div>
        {/* Destination overlay */}
        <div className="absolute bottom-3 left-4">
          <p className="text-white font-bold text-lg leading-tight">{destination}</p>
          <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" /> {formatDate(booking.travelDate)}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Booking Status</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 capitalize">
            {booking.status?.replace(/_/g, ' ')}
          </span>
        </div>
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Planning Progress</span>
            <span className="font-medium text-teal-600">{booking.status === 'completed' || booking.status === 'closed' ? 100 : booking.status === 'in_progress' ? 85 : booking.status === 'confirmed' ? 70 : 40}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${booking.status === 'completed' || booking.status === 'closed' ? 100 : booking.status === 'in_progress' ? 85 : booking.status === 'confirmed' ? 70 : 40}%` }}
            />
          </div>
        </div>
        <Link
          to="/bookings"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          View Booking <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Package Card ──────────────────────────────────────────────────────────

function PackageCard({ pkg }) {
  return (
    <Link to={`/packages/${pkg.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-40 overflow-hidden">
          <img
            src={getImageUrl(pkg.bannerImage)}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-teal-500 rounded-full text-white text-xs font-semibold">
            {pkg.durationDays}D
          </div>
          <div className="absolute bottom-2.5 left-3 right-3">
            <p className="text-white font-semibold text-sm leading-tight">{pkg.title}</p>
            <p className="text-white/75 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {pkg.destination}
            </p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">From</p>
            <p className="text-base font-bold text-teal-600">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
          </div>
          {pkg.rating ? (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {Number(pkg.rating).toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

// ─── Inspiration Card ──────────────────────────────────────────────────────

function InspirationCard({ icon: Icon, title, subtitle, children, to, iconBg }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1">{children}</div>
      {to && (
        <Link to={to} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
          Explore <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [bookingsRes, packagesRes] = await Promise.all([
          bookingsAPI.myBookings(),
          packagesAPI.list({ page: 1, limit: 6 }),
        ]);
        setBookings(bookingsRes.data?.data?.items || []);
        setPackages(packagesRes.data?.data?.items || []);
      } catch {
        setBookings([]);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { totalBookings, completedTrips, upcomingBookings, nextTrip, daysToNext, destinations } = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter((b) => ['completed', 'closed'].includes(b.status));
    const upcoming = bookings
      .filter((b) => new Date(b.travelDate) >= new Date() && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate));
    const next = upcoming[0] || null;
    const days = next ? daysUntil(next.travelDate) : null;
    const dests = [...new Set(completed.map((b) => b.package?.destination).filter(Boolean))];

    return {
      totalBookings: total,
      completedTrips: completed.length,
      upcomingBookings: upcoming.slice(0, 4),
      nextTrip: next,
      daysToNext: days,
      destinations: dests,
    };
  }, [bookings]);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Explorer';
  const initial = (user?.name?.[0] || user?.email?.[0] || 'E').toUpperCase();
  const season = getSeasonDestinations();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl mt-6 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 min-h-[220px] flex items-center p-6 sm:p-8">
          {/* Geometric decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-400/20 rounded-full -translate-y-1/2" />

          <div className="relative z-10 flex items-center gap-5 sm:gap-7 w-full">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/30 shadow-lg">
              <span className="text-white text-2xl sm:text-3xl font-bold">{initial}</span>
            </div>

            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <p className="text-teal-100 text-sm font-medium mb-1">
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} ✈️
              </p>
              <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
                Ready for your next adventure, {firstName}?
              </h1>
              {nextTrip ? (
                <p className="text-teal-100 text-sm mt-1.5">
                  Your trip to <span className="text-white font-semibold">{nextTrip.package?.destination || 'your destination'}</span>
                  {daysToNext !== null && daysToNext > 0 && (
                    <> starts in <span className="text-white font-semibold">{daysToNext} day{daysToNext !== 1 ? 's' : ''}</span></>
                  )}
                  {daysToNext === 0 && <span className="text-white font-semibold"> is today!</span>}
                </p>
              ) : (
                <p className="text-teal-100 text-sm mt-1.5">Discover your next great journey below.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionTile to="/packages" icon={Plane} title="Book a Trip" subtitle="200+ packages" gradient="from-teal-500 to-teal-700" />
          <ActionTile to="/trip-planner" icon={Sparkles} title="AI Planner" subtitle="Plan with AI" gradient="from-violet-500 to-purple-700" />
          <ActionTile to="/customize-package" icon={Wand2} title="Customize" subtitle="Build your own" gradient="from-orange-400 to-orange-600" />
          <ActionTile to="/community/public-chat" icon={Users} title="Community" subtitle="Connect & share" gradient="from-sky-500 to-blue-700" />
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </>
          ) : (
            <>
              <StatCard icon={Plane} value={totalBookings} label="Your Journeys" gradient="from-teal-400 to-teal-600" delay={0} />
              <StatCard icon={Camera} value={completedTrips} label="Memories Made" gradient="from-violet-400 to-violet-600" delay={100} />
              <StatCard icon={Calendar} value={upcomingBookings.length} label="Adventures Ahead" gradient="from-amber-400 to-orange-500" delay={200} />
            </>
          )}
        </section>

        {/* ── Upcoming Trips ────────────────────────────────────────────── */}
        {(loading || upcomingBookings.length > 0) && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upcoming Adventures</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your confirmed travel plans</p>
              </div>
              <Link to="/bookings" className="text-sm font-semibold text-teal-600 hover:text-teal-500 flex items-center gap-1">
                All bookings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBookings.map((b) => <UpcomingTripCard key={b.id} booking={b} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Discover Packages ─────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Discover New Destinations</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Handpicked packages for you</p>
            </div>
            <Link to="/packages" className="text-sm font-semibold text-teal-600 hover:text-teal-500 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56" />)}
            </div>
          ) : packages.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">No packages available right now.</div>
          )}
        </section>

        {/* ── Travel Inspiration ────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Get Inspired</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ideas for your next adventure</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Season */}
            <InspirationCard
              icon={season.season === 'Winter' ? Sun : season.season === 'Monsoon' ? Leaf : Mountain}
              title={`Best for ${season.season} ${season.emoji}`}
              subtitle={`Top destinations right now`}
              iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
              to="/packages"
            >
              <div className="flex flex-col gap-1.5 mt-1">
                {season.places.map((place) => (
                  <Link key={place} to={`/packages?search=${place}`} className="text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-teal-500" /> {place}
                  </Link>
                ))}
              </div>
            </InspirationCard>

            {/* Collections */}
            <InspirationCard
              icon={Compass}
              title="Trip Collections"
              subtitle="Curated for every traveler"
              iconBg="bg-gradient-to-br from-teal-500 to-cyan-600"
            >
              <div className="flex flex-col gap-1.5 mt-1">
                {[
                  { label: 'Weekend Getaways', q: 'weekend_trips' },
                  { label: 'Group Adventures', q: 'group_tours' },
                  { label: 'Family Tours', q: 'family_tours' },
                  { label: 'Pilgrimages', q: 'pilgrimage' },
                ].map((c) => (
                  <Link key={c.q} to={`/packages?category=${c.q}`} className="text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-teal-500" /> {c.label}
                  </Link>
                ))}
              </div>
            </InspirationCard>

            {/* Community */}
            <InspirationCard
              icon={Users}
              title="Travel Community"
              subtitle="Connect with fellow explorers"
              iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
              to="/community/public-chat"
            >
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Join destination-based chats and get real travel advice from people who've been there.</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Manali', 'Goa', 'Kashmir'].map((d) => (
                    <Link key={d} to={`/community/location/${d.toLowerCase()}`} className="text-xs px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full hover:bg-violet-100 transition">
                      {d}
                    </Link>
                  ))}
                </div>
              </div>
            </InspirationCard>
          </div>
        </section>

        {/* ── Achievements ─────────────────────────────────────────────── */}
        {!loading && (totalBookings > 0 || completedTrips > 0) && (
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Travel Journey</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Milestones & achievements</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">{totalBookings}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Trips</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-600">{completedTrips}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{destinations.length || completedTrips}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Destinations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-600">{upcomingBookings.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upcoming</p>
                </div>
              </div>

              {/* Badges */}
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Achievements</p>
                <div className="flex flex-wrap gap-2">
                  {totalBookings >= 1 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium border border-teal-100 dark:border-teal-800">
                      ✈️ First Journey
                    </span>
                  )}
                  {completedTrips >= 3 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium border border-violet-100 dark:border-violet-800">
                      🌟 Frequent Traveler
                    </span>
                  )}
                  {destinations.length >= 3 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-100 dark:border-amber-800">
                      🗺️ Explorer
                    </span>
                  )}
                  {upcomingBookings.length >= 1 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium border border-sky-100 dark:border-sky-800">
                      📅 Adventure Planner
                    </span>
                  )}
                  {totalBookings === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Complete your first booking to earn achievements!</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Empty state for new users ─────────────────────────────────── */}
        {!loading && totalBookings === 0 && (
          <section className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Start Your First Adventure</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
              You haven't booked any trips yet. Explore our curated packages and plan your first unforgettable journey.
            </p>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl transition text-sm"
            >
              <Plane className="w-4 h-4" /> Browse Packages
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
