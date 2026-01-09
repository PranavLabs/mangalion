'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MangaDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  const id = Array.isArray(params.id) ? params.id.join('/') : params.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if(!id) return;
    setLoading(true);
    setError('');
    
    fetch(`/api/manga?type=info&id=${encodeURIComponent(id)}&provider=${provider}`)
      .then(r => r.json())
      .then(fetchedData => {
        if (!fetchedData || Object.keys(fetchedData).length === 0) {
            setError('No data found.');
        } else {
            setData(fetchedData);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load info.');
        setLoading(false);
      });
  }, [id, provider]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-pink-500 font-light tracking-widest animate-pulse">SYNCING DATA...</div>
        </div>
    </div>
  );

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <p className="text-red-500 mb-6 font-medium text-lg">{error}</p>
        <Link 
            href="/" 
            className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/10 transition-all"
        >
            ← Return Home
        </Link>
      </div>
    );
  }

  // Helper for background image
  const bgImage = data.image ? `/api/proxy?url=${encodeURIComponent(data.image)}&source=${provider}` : '';
  const chapters = Array.isArray(data.chapters) ? data.chapters : [];

  return (
    <div className="min-h-screen relative bg-[#050505] text-white overflow-hidden selection:bg-pink-500 selection:text-white">
      
      {/* 1. FULLSCREEN BLURRED BACKGROUND */}
      {/* We use the manga cover, scale it up, and blur it heavily to create the atmosphere */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-[80px] scale-110 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url('${bgImage}')` }} 
      />
      
      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-10 min-h-screen flex flex-col justify-center">
        
        {/* 3. GLASS PANEL (The "Sheet") */}
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            
            {/* Top Shine Effect */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Close Button */}
            <Link 
                href="/" 
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white/50 hover:text-white"
            >
                ✕
            </Link>

            <div className="flex flex-col md:flex-row gap-10">
                {/* COVER ART */}
                <div className="w-full md:w-80 shrink-0 perspective-1000">
                    <img 
                        src={bgImage} 
                        className="w-full rounded-3xl shadow-2xl border border-white/10 md:-rotate-2 hover:rotate-0 transition-transform duration-500 ease-out object-cover aspect-[2/3]" 
                        alt={data.title}
                    />
                </div>

                {/* INFO TEXT */}
                <div className="flex-1">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 drop-shadow-lg">
                        {data.title}
                    </h1>

                    <div className="flex flex-wrap gap-3 mb-8">
                        <span className="px-4 py-1.5 rounded-full bg-pink-500/10 text-pink-200 border border-pink-500/20 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                            {data.status || 'Unknown'}
                        </span>
                        <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/20 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                            {provider}
                        </span>
                    </div>

                    <p className="text-lg text-white/70 leading-relaxed font-light max-h-48 overflow-y-auto custom-scrollbar pr-4">
                        {data.description || 'No description available for this title.'}
                    </p>
                </div>
            </div>

            {/* CHAPTERS SECTION */}
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                    <h2 className="text-2xl font-bold text-white/90">
                        Chapters <span className="text-white/30 text-lg ml-2 font-normal">({chapters.length})</span>
                    </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {chapters.map((c: any) => (
                        <Link 
                            key={c.id} 
                            href={`/read/${c.id}?provider=${provider}`} 
                            className="group relative px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/30 transition-all duration-300 text-sm font-medium text-white/70 hover:text-white truncate text-center backdrop-blur-md overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/5 transition-colors duration-300" />
                            <span className="relative z-10">
                                {c.title || `Chapter ${c.chapterNumber}`}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
