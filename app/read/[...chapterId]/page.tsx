'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  const mangaId = searchParams.get('mangaId'); 
  // FIX: Capture cover
  const coverParam = searchParams.get('cover');
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId.join('/') : params.chapterId;
  
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');

  const providerLabel = provider === 'mangapill' ? 'KOMIK (Main)' : 'KOMIK (Server 2)';

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

  // 2. Fetch Info for Nav & History
  useEffect(() => {
    if(!mangaId) return;
    
    fetch(`/api/manga?type=info&id=${encodeURIComponent(mangaId)}&provider=${provider}`)
        .then(r => r.json())
        .then(data => {
            if(data.chapters && Array.isArray(data.chapters)) {
                const currentIndex = data.chapters.findIndex((c: any) => c.id === chapterId);
                
                if (currentIndex !== -1) {
                    const currentCh = data.chapters[currentIndex];
                    const nextCh = data.chapters[currentIndex - 1]; 
                    const prevCh = data.chapters[currentIndex + 1]; 
                    
                    if (nextCh) setNextChapter(nextCh.id);
                    if (prevCh) setPrevChapter(prevCh.id);
                    
                    const title = currentCh.title || `Chapter ${currentCh.chapterNumber}`;
                    setCurrentTitle(title);
                    
                    document.title = `${title} - ${data.title} | KOMIK`;

                    // --- SAVE HISTORY ---
                    try {
                        const historyItem = {
                            id: mangaId,
                            title: data.title,
                            // FIX: Use the passed cover URL first, then fallback to API image
                            image: coverParam || data.image,
                            provider: provider,
                            chapterId: chapterId,
                            chapterTitle: title,
                            timestamp: Date.now(),
                        };

                        const existingHistory = JSON.parse(localStorage.getItem('komik_history') || '[]');
                        const filtered = existingHistory.filter((h: any) => h.id !== mangaId);
                        const newHistory = [historyItem, ...filtered].slice(0, 10);
                        
                        localStorage.setItem('komik_history', JSON.stringify(newHistory));
                    } catch (e) { console.error("History save failed"); }
                }
            }
        })
        .catch(e => console.error("Nav fetch failed", e));
  }, [mangaId, chapterId, provider, coverParam]); // Added coverParam to dependency

  return (
    <div className="bg-[#050505] min-h-screen flex flex-col items-center selection:bg-pink-500 selection:text-white pb-32">
       
       <div className="fixed top-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700 max-w-[95vw]">
            <div className="flex items-center gap-4 md:gap-6 px-5 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all hover:bg-black/80 hover:border-white/20">
                <Link 
                    // FIX: Pass cover back to details
                    href={mangaId ? `/manga/${mangaId}?provider=${provider}&cover=${encodeURIComponent(coverParam || '')}` : '/'} 
                    className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors text-sm tracking-wide shrink-0"
                >
                    <span className="text-lg">←</span> <span className="hidden md:inline">EXIT</span>
                </Link>
                <div className="w-px h-4 bg-white/10 shrink-0" />
                <div className="flex flex-col items-center justify-center min-w-[100px] md:min-w-[150px]">
                    <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest leading-none mb-0.5">{providerLabel}</span>
                    <span className="text-white font-medium text-xs md:text-sm truncate max-w-[150px] md:max-w-[250px]">{currentTitle || 'Loading...'}</span>
                </div>
                <div className="w-px h-4 bg-white/10 shrink-0" />
                <div className="text-white/40 text-xs font-mono uppercase tracking-widest shrink-0">{loading ? '...' : `${pages.length} PGS`}</div>
            </div>
       </div>

      <div className="w-full max-w-4xl flex flex-col items-center pt-0 min-h-screen">
        {loading && <div className="flex flex-col items-center justify-center mt-40 gap-4"><div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /><div className="text-pink-500 animate-pulse tracking-[0.2em] font-light text-sm">DECODING KOMIK...</div></div>}
        
        {pages.map((page, i) => {
          const imgUrl = typeof page === 'string' ? page : page.img;
          return (
            <div key={i} className="w-full relative mb-1 shadow-2xl">
               <img src={`/api/proxy?url=${encodeURIComponent(imgUrl)}&source=${provider}`} className="w-full h-auto block" loading="lazy" alt={`Page ${i + 1}`} />
            </div>
          );
        })}
        
        {!loading && pages.length === 0 && <div className="mt-40 p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md text-center max-w-md"><div className="text-4xl mb-4">Void</div><div className="text-red-400 font-light">No images found.</div></div>}

        {!loading && pages.length > 0 && (
            <div className="w-full max-w-lg mt-12 mb-20 px-4">
                <div className="flex gap-4 items-center justify-center">
                    {prevChapter ? (
                        <Link 
                            // FIX: Pass cover to next/prev
                            href={`/read/${prevChapter}?provider=${provider}&mangaId=${mangaId}&cover=${encodeURIComponent(coverParam || '')}`} 
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-center text-white/70 hover:text-white font-bold transition-all hover:-translate-y-1"
                        >
                            ← Previous
                        </Link>
                    ) : <div className="flex-1 py-4 border border-white/5 rounded-2xl text-center text-white/20 cursor-not-allowed">Start</div>}

                    {nextChapter ? (
                        <Link 
                            // FIX: Pass cover to next/prev
                            href={`/read/${nextChapter}?provider=${provider}&mangaId=${mangaId}&cover=${encodeURIComponent(coverParam || '')}`} 
                            className="flex-1 py-4 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 hover:border-pink-500/60 rounded-2xl text-center text-pink-200 hover:text-white font-bold transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(236,72,153,0.1)]"
                        >
                            Next →
                        </Link>
                    ) : <div className="flex-1 py-4 border border-white/5 rounded-2xl text-center text-white/20 cursor-not-allowed">Latest</div>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
