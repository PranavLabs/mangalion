'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  const mangaId = searchParams.get('mangaId'); // Get the Manga ID for context
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId.join('/') : params.chapterId;
  
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [chapterList, setChapterList] = useState<any[]>([]);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);

  // 1. Fetch Images
  useEffect(() => {
    if(!chapterId) return;
    setLoading(true);
    
    fetch(`/api/manga?type=chapter&id=${encodeURIComponent(chapterId)}&provider=${provider}`)
      .then(r => r.json())
      .then(data => {
        const p = Array.isArray(data) ? data : data.images || [];
        setPages(p);
        setLoading(false);
      })
      .catch(e => setLoading(false));
  }, [chapterId, provider]);

  // 2. Fetch Chapter List (For Navigation)
  useEffect(() => {
    if(!mangaId) return;
    
    // We fetch the manga info silently to get the chapter list
    fetch(`/api/manga?type=info&id=${encodeURIComponent(mangaId)}&provider=${provider}`)
        .then(r => r.json())
        .then(data => {
            if(data.chapters && Array.isArray(data.chapters)) {
                setChapterList(data.chapters);
                
                // Find current index
                const currentIndex = data.chapters.findIndex((c: any) => c.id === chapterId);
                
                if (currentIndex !== -1) {
                    // Most APIs return chapters Descending (Newest first)
                    // So "Next" in story is usually index - 1 (moving up the array)
                    // "Previous" in story is index + 1 (moving down)
                    
                    // However, we'll label them strictly by array order to be safe
                    // You might need to swap these depending on your preference
                    const nextCh = data.chapters[currentIndex - 1]; // Newer Chapter
                    const prevCh = data.chapters[currentIndex + 1]; // Older Chapter
                    
                    if (nextCh) setNextChapter(nextCh.id);
                    if (prevCh) setPrevChapter(prevCh.id);
                }
            }
        })
        .catch(e => console.error("Nav fetch failed", e));
  }, [mangaId, chapterId, provider]);

  return (
    <div className="bg-[#050505] min-h-screen flex flex-col items-center selection:bg-pink-500 selection:text-white pb-32">
       
       {/* FLOATING HEADER */}
       <div className="fixed top-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-6 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all hover:bg-black/80 hover:border-white/20 hover:scale-105 group">
                
                {/* FIX: Exit goes to Manga Details if mangaId exists */}
                <Link 
                    href={mangaId ? `/manga/${mangaId}?provider=${provider}` : '/'} 
                    className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors text-sm tracking-wide"
                >
                    <span className="text-lg">←</span> 
                    <span>EXIT</span>
                </Link>

                <div className="w-px h-4 bg-white/10" />

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

      {/* READER CANVAS */}
      <div className="w-full max-w-4xl flex flex-col items-center pt-0 min-h-screen">
        
        {loading && (
            <div className="flex flex-col items-center justify-center mt-40 gap-4">
                 <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                 <div className="text-pink-500 animate-pulse tracking-[0.2em] font-light text-sm">DECODING VISUALS...</div>
            </div>
        )}
        
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
        
        {!loading && pages.length === 0 && (
           <div className="mt-40 p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md text-center max-w-md">
               <div className="text-4xl mb-4">Void</div>
               <div className="text-red-400 font-light">No images found in this sector.</div>
               <div className="text-white/30 text-xs mt-2">Try switching providers on the home screen.</div>
           </div>
        )}

        {/* NAVIGATION BUTTONS FOOTER */}
        {!loading && pages.length > 0 && (
            <div className="w-full max-w-lg mt-12 mb-20 px-4">
                <div className="flex gap-4 items-center justify-center">
                    {prevChapter ? (
                        <Link 
                            href={`/read/${prevChapter}?provider=${provider}&mangaId=${mangaId}`}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-center text-white/70 hover:text-white font-bold transition-all hover:-translate-y-1"
                        >
                            ← Previous
                        </Link>
                    ) : (
                        <div className="flex-1 py-4 border border-white/5 rounded-2xl text-center text-white/20 cursor-not-allowed">
                            Start
                        </div>
                    )}

                    {nextChapter ? (
                        <Link 
                            href={`/read/${nextChapter}?provider=${provider}&mangaId=${mangaId}`}
                            className="flex-1 py-4 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 hover:border-pink-500/60 rounded-2xl text-center text-pink-200 hover:text-white font-bold transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(236,72,153,0.1)]"
                        >
                            Next →
                        </Link>
                    ) : (
                        <div className="flex-1 py-4 border border-white/5 rounded-2xl text-center text-white/20 cursor-not-allowed">
                            Latest
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
