import { Link } from 'react-router-dom';
import { Clock, Tag } from 'lucide-react';

const posts = [
  {
    id: 1,
    title: 'Top 10 Hidden Gems in Himachal Pradesh',
    excerpt: 'Beyond Manali and Shimla lies a treasure trove of undiscovered villages, alpine meadows, and ancient temples that most tourists never see.',
    category: 'Destinations',
    readTime: '6 min read',
    date: 'April 20, 2026',
    gradient: 'from-blue-500 to-indigo-600',
    initials: 'HP',
  },
  {
    id: 2,
    title: 'Planning the Perfect Kerala Backwater Cruise',
    excerpt: 'Everything you need to know about choosing the right houseboat, the best season to visit, and what to expect on a Kerala backwater journey.',
    category: 'Travel Tips',
    readTime: '5 min read',
    date: 'April 12, 2026',
    gradient: 'from-green-500 to-teal-600',
    initials: 'KL',
  },
  {
    id: 3,
    title: 'A First-Timer\'s Guide to Leh-Ladakh',
    excerpt: 'Altitude sickness, road conditions, permits, best routes — everything a first-time visitor to Ladakh needs to prepare for this bucket-list destination.',
    category: 'Guides',
    readTime: '8 min read',
    date: 'March 28, 2026',
    gradient: 'from-orange-500 to-amber-600',
    initials: 'LL',
  },
  {
    id: 4,
    title: 'Budget Travel in Rajasthan: Forts, Food & Festivals',
    excerpt: 'Rajasthan doesn\'t have to break the bank. Here\'s how to experience the royal state\'s best without spending like a maharaja.',
    category: 'Budget Travel',
    readTime: '7 min read',
    date: 'March 15, 2026',
    gradient: 'from-pink-500 to-rose-600',
    initials: 'RJ',
  },
  {
    id: 5,
    title: 'Why Uttarakhand Should Be Your Next Adventure Trip',
    excerpt: 'From trekking the Valley of Flowers to white-water rafting in Rishikesh — Uttarakhand offers adventure at every altitude.',
    category: 'Adventure',
    readTime: '5 min read',
    date: 'March 2, 2026',
    gradient: 'from-teal-500 to-cyan-600',
    initials: 'UK',
  },
  {
    id: 6,
    title: 'Honeymoon Destinations in India You Haven\'t Considered',
    excerpt: 'Beyond Goa and Shimla — discover romantic getaways in Coorg, Khajjiar, Tawang, and other lesser-known but incredibly scenic spots.',
    category: 'Honeymoon',
    readTime: '6 min read',
    date: 'February 14, 2026',
    gradient: 'from-purple-500 to-violet-600',
    initials: 'HM',
  },
];

const categories = ['All', 'Destinations', 'Travel Tips', 'Guides', 'Budget Travel', 'Adventure', 'Honeymoon'];

export function BlogPage() {
  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">TravelSphere Blog</h1>
          <p className="text-teal-100 text-lg">Stories, tips, and guides for every kind of traveler.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${cat === 'All' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 group">
              {/* Placeholder image */}
              <div className={`h-44 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
                <span className="text-white text-4xl font-bold opacity-30">{post.initials}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                    <Tag className="w-3 h-3" /> {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <button className="text-sm text-teal-600 font-medium hover:underline">Read More →</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Coming soon note */}
        <div className="mt-12 text-center py-10 border-t border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm">More articles coming soon. Subscribe to our newsletter to get notified.</p>
        </div>
      </div>
    </div>
  );
}
