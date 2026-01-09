'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Default provider
  const [provider, setProvider] = useState('mangapill');

  const fetchManga = async (q?: string) => {
    setLoading(true);
    setMangaList([]); 

    try {
        const url = q 
          ? `/api/manga?provider=${provider}&q=${encodeURIComponent(q)}` 
          : `/api/manga?provider=${provider}`;
          
        const res = await fetch(url);
        const data = await res.json();
        
        if (Array.isArray(data.results)) {
            setMangaList(data.results);
        } else if (Array.isArray(data)) {
            setMangaList(data);
        } else {
            setMangaList([]);
        }
    } catch (e) { 
        console.error("Failed to fetch manga:", e);
        setMangaList([]);
    }
    setLoading(false);
  };

  useEffect(() => { 
      fetchManga(search); 
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); 

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto items-center">
          <div className="w-full md:w-auto flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 uppercase font-bold tracking-wider">Source</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 text-blue-400 font-bold focus:outline-none focus:border-blue-600 cursor-pointer appearance-none min-w-[200px]"
            >
              <option value="mangapill">MangaPill (Fast)</option>
              <option value="mangahere">MangaHere (Classic)</option>
              {/* UPDATED OPTION */}
              <option value="weebcentral">WeebCentral (Quality)</option>
            </select>
          </div>

          <div className="flex-1 w-full flex gap-2">
            <input 
              className="flex-1 p-4 bg-neutral-900 rounded-lg border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all"
              placeholder={`Search on ${provider}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
            />
            <button 
                onClick={() => fetchManga(search)} 
                className="bg-blue-700 hover:bg-blue-600 px-8 rounded-lg font-bold transition-colors"
            >
                GO
            </button>
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="text-xl font-bold text-gray-500">Loading {provider}...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mangaList.map((m) => (
              <Link 
                href={`/manga/${m.id}?provider=${provider}`} 
                key={m.id} 
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-900 mb-3 shadow-lg border border-neutral-800">
                    <img 
                        src={m.image ? `/api/proxy?url=${encodeURIComponent(m.image)}&source=${provider}` : '/placeholder.png'} 
                        className="object-cover w-full h-full group-hover:scale-110 transition duration-500 ease-out opacity-90 group-hover:opacity-100"
                        alt={m.title}
                        loading="lazy"
                    />
                </div>
                <h3 className="text-sm font-bold text-gray-300 truncate group-hover:text-blue-400">
                    {m.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
