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
    // Clear the list immediately so the user knows something is happening
    setMangaList([]); 

    try {
        // Construct URL: /api/manga?provider=mangapill&q=one_piece
        const url = q 
          ? `/api/manga?provider=${provider}&q=${encodeURIComponent(q)}` 
          : `/api/manga?provider=${provider}`;
          
        const res = await fetch(url);
        const data = await res.json();
        
        // Defensive check: Ensure results is an array before setting
        if (Array.isArray(data.results)) {
            setMangaList(data.results);
        } else if (Array.isArray(data)) {
             // Some providers return the array directly
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

  // Trigger fetch whenever the provider changes (or on initial load)
  useEffect(() => { 
      fetchManga(search); 
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); 

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER & CONTROLS --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto items-center">
          
          {/* PROVIDER DROPDOWN */}
          <div className="w-full md:w-auto flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 uppercase font-bold tracking-wider">Source Engine</label>


<select 
  value={provider}
  onChange={(e) => setProvider(e.target.value)}
  className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 text-blue-400 font-bold focus:outline-none focus:border-blue-600 cursor-pointer appearance-none min-w-[200px]"
>
  <option value="mangapill">MangaPill (Fast)</option>
  <option value="mangakakalot">Mangakakalot (Stable)</option>
  {/* NEW OPTION */}
  <option value="mangahere">MangaHere (Classic)</option>
</select>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 w-full flex gap-2">
            <input 
              className="flex-1 p-4 bg-neutral-900 rounded-lg border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              placeholder={`Search on ${provider}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
            />
            <button 
                onClick={() => fetchManga(search)} 
                className="bg-blue-700 hover:bg-blue-600 px-8 rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20"
            >
                GO
            </button>
          </div>
        </div>

        {/* --- CONTENT GRID --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="text-xl font-bold text-gray-500">Connecting to {provider}...</div>
            <p className="text-sm text-gray-700 mt-2">Fetching titles and thumbnails</p>
          </div>
        ) : (
          <>
            {mangaList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mangaList.map((m) => (
                    <Link 
                        // IMPORTANT: Pass the provider to the URL so the next page knows what to use
                        href={`/manga/${m.id}?provider=${provider}`} 
                        key={m.id} 
                        className="group flex flex-col"
                    >
                        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-900 mb-3 shadow-2xl border border-neutral-800 group-hover:border-blue-800 transition-colors">
                            {/* PROXY IMAGE: 
                                We do NOT send &referer= anymore. 
                                The route.ts file calculates it automatically.
                            */}
                            // Find the <img /> tag inside the map loop and replace it with this:

<img 
  // FIX: We append &source={provider} to ensure the proxy knows which header to use
  src={m.image ? `/api/proxy?url=${encodeURIComponent(m.image)}&source=${provider}` : '/placeholder.png'} 
  className="object-cover w-full h-full group-hover:scale-110 transition duration-500 ease-out opacity-90 group-hover:opacity-100"
  alt={m.title}
  loading="lazy"
/>
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        
                        <h3 className="text-sm font-bold text-gray-300 truncate group-hover:text-blue-400 transition-colors">
                            {m.title}
                        </h3>
                        
                        <div className="flex gap-2 text-xs text-gray-600 mt-1">
                            <span className="capitalize">{m.status || 'Manga'}</span>
                            <span>•</span>
                            <span className="uppercase text-gray-500">{provider}</span>
                        </div>
                    </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-600">No results found</h2>
                    <p className="text-gray-500 mt-2">Try a different search term or switch the Source Engine.</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
