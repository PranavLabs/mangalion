'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId.join('/') : params.chapterId;
  
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!chapterId) return;
    setLoading(true);
    
    fetch(`/api/manga?type=chapter&id=${encodeURIComponent(chapterId)}&provider=${provider}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
            setPages(data);
        } else if (data && Array.isArray(data.images)) {
            setPages(data.images);
        } else {
            setPages([]);
        }
        setLoading(false);
      })
      .catch(e => setLoading(false));
  }, [chapterId, provider]);

  return (
    <div className="bg-[#050505] min-h-screen flex flex-col items-center selection:bg-pink-500 selection:text-white">
       
       {/* 1. FLOATING GLASS CONTROL ISLAND */}
       {/* Replaces the old sticky bar with a modern floating pill */}
       <div className="fixed top-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-6 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all hover:bg-black/80 hover:border-white/20 hover:scale-105 group">
                
                {/* Back Button */}
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors text-sm tracking-wide"
                >
                    <span className="text-lg">←</span> 
                    <span>EXIT</span>
                </Link>

                {/* Vertical Divider */}
                <div className="w-px h-4 bg-white/10" />

                {/* Info Text */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest leading-none mb-0.5">
                        {provider}
                    </span>
                    <span className="text-white/40 text-xs font-mono uppercase tracking-widest group-hover:text-white/60 transition-colors">
                        {loading ? 'SYNCING...' : `${pages.length} PAGES`}
                    </span>
                </div>
            </div>
       </div>

      {/* 2. READER CANVAS */}
      <div className="w-full max-w-4xl flex flex-col items-center pb-20 pt-0 min-h-screen">
        
        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center mt-40 gap-4">
                 <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                 <div className="text-pink-500 animate-pulse tracking-[0.2em] font-light text-sm">DECODING VISUALS...</div>
            </div>
        )}
        
        {/* Image Stream */}
        {pages.map((page, i) => {
          const imgUrl = typeof page === 'string' ? page : page.img;
          return (
            <div key={i} className="w-full relative mb-1 shadow-2xl">
               <img 
                 src={`/api/proxy?url=${encodeURIComponent(imgUrl)}&source=${provider}`}
                 className="w-full h-auto block"
                 loading="lazy"
                 alt={`Page ${i + 1}`}
               />
            </div>
          );
        })}
        
        {/* Empty State */}
        {!loading && pages.length === 0 && (
           <div className="mt-40 p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md text-center max-w-md">
               <div className="text-4xl mb-4">Void</div>
               <div className="text-red-400 font-light">No images found in this sector.</div>
               <div className="text-white/30 text-xs mt-2">Try switching providers on the home screen.</div>
           </div>
        )}

        {/* End of Chapter Marker */}
        {!loading && pages.length > 0 && (
            <div className="mt-10 mb-20 text-white/20 text-xs tracking-[0.3em] font-light uppercase">
                — End of Chapter —
            </div>
        )}
      </div>
    </div>
  );
}
