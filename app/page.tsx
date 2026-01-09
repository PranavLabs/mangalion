'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Existing state logic
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
    // LIQUID BACKGROUND
    <div className="min-h-screen bg-[#0f0f11] text-white selection:bg-pink-500 selection:text-white overflow-x-hidden relative">
      
      {/* Ambient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* HEADER: GLASS BAR */}
        <div className="sticky top-4 z-50 mb-12">
            <div className="flex flex-col md:flex-row gap-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl ring-1 ring-black/5">
            
            {/* SOURCE PILL */}
            <div className="relative group w-full md:w-auto">
                <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="appearance-none w-full md:w-48 bg-black/20 hover:bg-black/40 text-white font-medium py-3 px-6 rounded-3xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer"
                >
                    <option value="mangapill">MangaPill</option>
                    <option value="mangahere">MangaHere</option>
                </select>
                {/* Custom Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">
                    ▼
                </div>
            </div>

            {/* SEARCH PILL */}
            <div className="flex-1 flex gap-2 w-full">
                {/* FIX: added min-w-0 to allow shrinking on mobile */}
                <input 
                  className="flex-1 min-w-0 bg-transparent text-white placeholder-white/40 px-4 md:px-6 py-3 focus:outline-none text-base md:text-lg font-light"
                  placeholder={`Search on ${provider}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
                />
                {/* FIX: reduced padding on mobile (px-6) vs desktop (px-8), added shrink-0 */}
                <button 
                    onClick={() => fetchManga(search)} 
                    className="shrink-0 bg-white text-black hover:bg-pink-500 hover:text-white px-6 md:px-8 rounded-3xl font-bold transition-all duration-300 shadow-lg shadow-white/10"
                >
                    GO
                </button>
            </div>
            </div>
        </div>

        {/* CONTENT GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
             <div className="text-white/50 font-light tracking-widest animate-pulse">LOADING LIBRARY</div>
          </div>
        ) : (
          <>
            {mangaList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mangaList.map((m) => (
                    <Link 
                        href={`/manga/${m.id}?provider=${provider}`} 
                        key={m.id} 
                        className="group relative"
                    >
                        {/* GLASS CARD */}
                        <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl relative transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-pink-500/20 group-hover:border-pink-500/30">
                            <img 
                                src={m.image ? `/api/proxy?url=${encodeURIComponent(m.image)}&source=${provider}` : '/placeholder.png'} 
                                className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                alt={m.title}
                                loading="lazy"
                            />
                            {/* Glossy Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-white/10 opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            {/* Text Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-bold truncate text-shadow-sm drop-shadow-md">
                                    {m.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                    <p className="text-xs text-pink-200/80 uppercase tracking-wider font-semibold">
                                        {provider}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 max-w-lg mx-auto">
                    <h2 className="text-3xl font-bold text-white/20">VOID</h2>
                    <p className="text-white/40 mt-2">No reality found. Search again.</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
