'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [popular, setPopular] = useState<any[]>([]);
  const [ongoing, setOngoing] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // NEW: History State
  const [history, setHistory] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [provider, setProvider] = useState('mangapill');

  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    try {
        const [popRes, latestRes] = await Promise.all([
            fetch(`/api/manga?type=popular&provider=${provider}`),
            fetch(`/api/manga?type=latest&provider=${provider}`)
        ]);

        const popData = await popRes.json();
        const latestData = await latestRes.json();

        setPopular(Array.isArray(popData.results) ? popData.results : (Array.isArray(popData) ? popData : []));
        setOngoing(Array.isArray(latestData.results) ? latestData.results : (Array.isArray(latestData) ? latestData : []));
        
    } catch (e) {
        console.error("Home fetch failed", e);
    }
    setLoading(false);
  }, [provider]);

  const executeSearch = useCallback(async (q: string) => {
      if(!q.trim()) {
          setSearchResults([]);
          return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/manga?provider=${provider}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      } catch (e) { setSearchResults([]); }
      setSearching(false);
  }, [provider]);

  // LOAD HISTORY ON MOUNT
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('komik_history');
          if (saved) {
              setHistory(JSON.parse(saved));
          }
      }
  }, []);

  useEffect(() => { 
      if (search === '') fetchHomeData(); 
  }, [fetchHomeData, search]); 

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setSearching(false); return; }
    const delayDebounceFn = setTimeout(() => { executeSearch(search); }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [search, executeSearch]);

  // Card Component
  const MangaCard = ({ m }: { m: any }) => (
    <Link href={`/manga/${m.id}?provider=${provider}`} className="group relative">
        <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl relative transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-pink-500/20 group-hover:border-pink-500/30">
            {m.image ? (
                <img src={`/api/proxy?url=${encodeURIComponent(m.image)}&source=${provider}`} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt={m.title} loading="lazy" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center p-4"><span className="text-white/20 text-xs font-bold uppercase tracking-widest text-center">No Cover</span></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-white/10 opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold truncate text-shadow-sm drop-shadow-md">{m.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    <p className="text-xs text-pink-200/80 uppercase tracking-wider font-semibold">KOMIK</p>
                </div>
            </div>
        </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white selection:bg-pink-500 selection:text-white overflow-x-hidden relative bg-[url('/noise.png')]">
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-4 bg-[#0f0f11]/70 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 group cursor-default">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-white/10 group-hover:scale-105 transition-transform">
                      <Image src="/logo.png" alt="KOMIK Logo" fill className="object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-pink-500', 'to-blue-500'); }} />
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-blue-500/20 z-0"></div>
                  </div>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 tracking-tight drop-shadow-sm">KOMIK</span>
              </div>
          </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 mt-4">
        
        {/* SEARCH CONTROLS */}
        <div className="sticky top-24 z-40 mb-8">
            <div className="flex flex-col md:flex-row gap-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl ring-1 ring-black/5">
                <div className="relative group w-full md:w-auto">
                    <select value={provider} onChange={(e) => { setProvider(e.target.value); if(search) executeSearch(search); }} className="appearance-none w-full md:w-48 bg-black/40 hover:bg-black/60 text-white font-medium py-3 px-6 rounded-3xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer text-sm">
                        <option value="mangapill">Server 1 (Fast)</option>
                        <option value="mangahere">Server 2 (Classic)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</div>
                </div>
                <div className="flex-1 flex gap-2 w-full">
                    <input className="flex-1 min-w-0 bg-transparent text-white placeholder-white/40 px-4 md:px-6 py-3 focus:outline-none text-base font-light" placeholder="Search titles..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSearch(search)} />
                    <button onClick={() => executeSearch(search)} className="shrink-0 bg-white text-black hover:bg-pink-500 hover:text-white px-6 md:px-8 rounded-3xl font-bold transition-all duration-300 shadow-lg shadow-white/10">GO</button>
                </div>
            </div>
        </div>

        {/* LOADING */}
        {loading && !search && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
             <div className="text-white/50 font-light tracking-widest animate-pulse">CONNECTING TO SERVER...</div>
          </div>
        )}

        {/* MAIN CONTENT */}
        {!loading && (
            <>
                {/* 1. SEARCH RESULTS */}
                {search.trim() !== '' && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="text-pink-500">🔎</span> Search Results {searching && <span className="text-sm text-white/40 font-normal animate-pulse">(Searching...)</span>}</h2>
                        {!searching && searchResults.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">{searchResults.map((m) => <MangaCard key={m.id} m={m} />)}</div>}
                        {!searching && searchResults.length === 0 && <div className="text-center py-20 text-white/30 border border-white/5 rounded-3xl bg-white/5">No results found for "{search}".</div>}
                    </div>
                )}

                {/* 2. HOME FEED */}
                {search.trim() === '' && (
                    <div className="animate-in fade-in duration-700">
                        
                        {/* --- CONTINUE READING (NEW) --- */}
                        {history.length > 0 && (
                            <div className="mb-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl">📖</span>
                                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 uppercase tracking-wide">Continue Reading</h2>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                    {history.map((h, i) => (
                                        <Link 
                                            key={i} 
                                            // LINK DIRECTLY TO LAST READ CHAPTER
                                            href={`/read/${h.chapterId}?provider=${h.provider}&mangaId=${h.id}`} 
                                            className="snap-start shrink-0 w-64 group relative rounded-3xl overflow-hidden border border-white/10 bg-white/5"
                                        >
                                            <div className="relative h-32 overflow-hidden">
                                                {h.image && <img src={`/api/proxy?url=${encodeURIComponent(h.image)}&source=${h.provider}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={h.title} />}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] to-transparent" />
                                            </div>
                                            <div className="p-4 relative -mt-10">
                                                <h3 className="font-bold text-lg truncate text-shadow">{h.title}</h3>
                                                <p className="text-pink-400 text-sm mt-1 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                    {h.chapterTitle}
                                                </p>
                                                <p className="text-white/20 text-xs mt-3 uppercase tracking-wider font-mono">Resume ›</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* POPULAR */}
                        <div className="mb-16">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">🔥</span>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide">Popular Now</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">{popular.map((m) => <MangaCard key={m.id} m={m} />)}</div>
                        </div>

                        {/* ONGOING */}
                        <div className="mb-12">
                             <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">⚡</span>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 uppercase tracking-wide">Fresh Updates</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">{ongoing.map((m) => <MangaCard key={m.id} m={m} />)}</div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}
