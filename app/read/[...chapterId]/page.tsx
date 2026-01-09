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
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center">
       <div className="w-full bg-neutral-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg border-b border-neutral-700">
            <Link href="/" className="text-white font-bold hover:text-blue-400">← Back</Link>
            <span className="text-gray-400 text-xs md:text-sm font-mono">
                {loading ? 'Loading...' : `${provider} • ${pages.length} Pages`}
            </span>
       </div>

      <div className="w-full max-w-4xl flex flex-col items-center pb-20 bg-black min-h-screen">
        {loading && <div className="mt-20 text-blue-400 animate-pulse">Fetching Images...</div>}
        
        {pages.map((page, i) => {
          const imgUrl = typeof page === 'string' ? page : page.img;
          return (
            <div key={i} className="w-full relative mb-1">
               <img 
                 src={`/api/proxy?url=${encodeURIComponent(imgUrl)}&source=${provider}`}
                 className="w-full h-auto"
                 loading="lazy"
                 alt={`Page ${i + 1}`}
               />
            </div>
          );
        })}
        
        {!loading && pages.length === 0 && (
           <div className="p-10 text-red-400 text-center">
               No images found. This chapter might be locked or empty.
           </div>
        )}
      </div>
    </div>
  );
}
