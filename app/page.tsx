'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchManga = async (q?: string) => {
    setLoading(true);
    try {
        const res = await fetch(q ? `/api/manga?q=${q}` : '/api/manga');
        const data = await res.json();
        setMangaList(data.results || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchManga(); }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="flex gap-3 mb-8 max-w-2xl mx-auto">
          <input 
            className="flex-1 p-4 bg-neutral-800 rounded-lg border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Search Manga (e.g. One Piece)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
          />
          <button 
            onClick={() => fetchManga(search)} 
            className="bg-blue-600 hover:bg-blue-700 px-8 rounded-lg font-bold transition-colors"
          >
            GO
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
               <div key={i} className="aspect-[2/3] bg-neutral-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mangaList.map((m) => (
              <Link href={`/manga/${m.id}`} key={m.id} className="group flex flex-col">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-800 shadow-lg border border-neutral-800 mb-3">
                  <img 
                    src={`/api/proxy?url=${encodeURIComponent(m.image)}&referer=https://www.mangahere.cc/`} 
                    className="object-cover w-full h-full group-hover:scale-110 transition duration-500 ease-out"
                    alt={m.title}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-bold text-neutral-200 truncate group-hover:text-blue-400 transition-colors">
                    {m.title}
                </h3>
                <span className="text-xs text-neutral-500 capitalize">{m.status || 'Manga'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
