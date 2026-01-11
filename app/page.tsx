'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [popular, setPopular] = useState<any[]>([]);
  const [ongoing, setOngoing] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('mangapill');

  // Fetch Logic
  const fetchHomeData = async () => {
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
  };

  const executeSearch = async (q: string) => {
      if(!q.trim()) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/manga?provider=${provider}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      } catch (e) {
          setSearchResults([]);
      }
      setLoading(false);
  };

  // Initial Load
  useEffect(() => { 
      if (search === '') {
          fetchHomeData(); 
      }
  }, [provider, search]); 

  // Card Component
  const MangaCard = ({ m }: { m: any }) => (
    <Link href={`/manga/${m.id}?provider=${provider}`} className="group relative">
        <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl relative transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-pink-500/20 group-hover:border-pink-500/30">
            <img 
                src={m.image ? `/api/proxy?url=${encodeURIComponent(m.image)}&source=${provider}` : '/placeholder.png'} 
                className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                alt={m.title}
                loading="lazy"
            />
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
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-4 bg-[#0f0f11]/70 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              
              {/* BRANDING */}
              <div className="flex items-center gap-3 group cursor-default">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-white/10 group-hover:scale-105 transition-transform">
                      <Image 
                        src="/logo.png" 
                        alt="KOMIK Logo" 
                        fill
                        className="object-cover z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-pink-500', 'to-blue-500'); }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-blue-500/20 z-0"></div>
                  </div>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 tracking-tight drop-shadow-sm">
                    KOMIK
                  </span>
              </div>

              {/* DISCORD BUTTON (Restored) */}
              <div className="flex items-center">
                  <a 
                    href="https://discord.gg/your-invite-code" // REPLACE THIS
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hidden md:flex items-center gap-2 px-5 py-2 bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/30 rounded-full text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)] hover:shadow-[0_0_25px_rgba(88,101,242,0.6)] hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-1.291 2.665 18.354 18.354 0 0 0-4.135 0 13.46 13.46 0 0 0-1.29-2.665.074.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>
                    <span>Join Discord</span>
                  </a>
                  {/* Mobile Icon */}
                  <a 
                    href="https://discord.gg/your-invite-code"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="md:hidden flex items-center justify-center w-10 h-10 bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/30 rounded-full text-white transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)]"
                  >
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-1.291 2.665 18.354 18.354 0 0 0-4.135 0 13.46 13.46 0 0 0-1.29-2.665.074.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>
                  </a>
              </div>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 mt-4">
        
        {/* CONTROLS */}
        <div className="sticky top-24 z-40 mb-12">
            <div className="flex flex-col md:flex-row gap-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl ring-1 ring-black/5">
                <div className="relative group w-full md:w-auto">
                    <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="appearance-none w-full md:w-48 bg-black/40 hover:bg-black/60 text-white font-medium py-3 px-6 rounded-3xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer text-sm"
                    >
                        <option value="mangapill">Server 1 (Fast)</option>
                        <option value="mangahere">Server 2 (Classic)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</div>
                </div>

                <div className="flex-1 flex gap-2 w-full">
                    <input 
                      className="flex-1 min-w-0 bg-transparent text-white placeholder-white/40 px-4 md:px-6 py-3 focus:outline-none text-base font-light"
                      placeholder="Search titles..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && executeSearch(search)}
                    />
                    <button 
                        onClick={() => executeSearch(search)} 
                        className="shrink-0 bg-white text-black hover:bg-pink-500 hover:text-white px-6 md:px-8 rounded-3xl font-bold transition-all duration-300 shadow-lg shadow-white/10"
                    >
                        GO
                    </button>
                </div>
            </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
             <div className="text-white/50 font-light tracking-widest animate-pulse">CONNECTING TO SERVER...</div>
          </div>
        )}

        {/* CONTENT LOGIC */}
        {!loading && (
            <>
                {/* 1. SEARCH RESULTS */}
                {search.trim() !== '' && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                             <span className="text-pink-500">🔎</span> Search Results
                        </h2>
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {searchResults.map((m) => <MangaCard key={m.id} m={m} />)}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-white/30">No results found.</div>
                        )}
                    </div>
                )}

                {/* 2. HOME FEED */}
                {search.trim() === '' && (
                    <>
                        {/* POPULAR GRID */}
                        <div className="mb-16">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">🔥</span>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wide">
                                    Popular Now
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {popular.map((m) => <MangaCard key={m.id} m={m} />)}
                            </div>
                        </div>

                        {/* ONGOING GRID */}
                        <div className="mb-12">
                             <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">⚡</span>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 uppercase tracking-wide">
                                    Fresh Updates
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {ongoing.map((m) => <MangaCard key={m.id} m={m} />)}
                            </div>
                        </div>
                    </>
                )}
            </>
        )}
      </div>
    </div>
  );
}
