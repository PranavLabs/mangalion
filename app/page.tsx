'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('mangapill');

  const fetchManga = async (q?: string) => {
    setLoading(true);
    setMangaList([]);
    try {
        const url = q 
          ? `/api/manga?provider=${provider}&q=${q}` 
          : `/api/manga?provider=${provider}`;
        const res = await fetch(url);
        const data = await res.json();
        setMangaList(data.results || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchManga(search); }, [provider]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
          <select 
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="p-4 bg-neutral-800 rounded-lg border border-neutral-700 text-blue-400 font-bold focus:outline-none cursor-pointer"
          >
            <option value="mangapill">MangaPill (Fast)</option>
            <option value="comick">ComicK (High Quality)</option>
            <option value="mangadex">MangaDex (Huge Lib)</option>
          </select>

          <div className="flex-1 flex gap-2">
            <input 
              className="flex-1 p-4 bg-neutral-800 rounded-lg border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder={`Search on ${provider}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
            />
            <button onClick={() => fetchManga(search)} className="bg-blue-600 hover:bg-blue-700 px-8 rounded-lg font-bold">GO</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center animate-pulse text-gray-500">Loading from {provider}...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mangaList.map((m) => (
              <Link href={`/manga/${m.id}?provider=${provider}`} key={m.id} className="group flex flex-col">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-800 mb-3">
                  {/* CLEAN IMAGE URL - NO HARDCODED REFERER */}
                  <img 
                    src={`/api/proxy?url=${encodeURIComponent(m.image)}`} 
                    className="object-cover w-full h-full group-hover:scale-110 transition duration-500"
                    alt={m.title}
                    loading="lazy"
                  />
                </div>
                <h3 className="text-sm font-bold text-neutral-200 truncate group-hover:text-blue-400">{m.title}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
