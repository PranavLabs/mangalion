'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const params = useParams();
  // The ID comes as an array (['manga', 'c001']), we join it back to a string
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId.join('/') : params.chapterId;
  
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!chapterId) return;

    // We must encode the ID because it contains slashes
    fetch(`/api/manga?type=chapter&id=${encodeURIComponent(chapterId)}`)
      .then(r => r.json())
      .then(data => {
        // Some providers return data directly, some wrap it in an array
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [chapterId]);

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center">
       {/* Reader Header */}
       <div className="w-full bg-neutral-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg border-b border-neutral-700">
            <Link href="/" className="text-white font-bold hover:text-blue-400 transition">← Back Home</Link>
            <span className="text-gray-400 text-xs md:text-sm font-mono">
              {loading ? 'Loading Pages...' : `Page 1 / ${pages.length}`}
            </span>
       </div>

      <div className="w-full max-w-4xl flex flex-col items-center pb-20 bg-black min-h-screen">
        {loading && <div className="mt-20 text-blue-400 animate-pulse">Fetching Chapter Images...</div>}
        
        {pages.map((p, i) => (
          <div key={i} className="w-full relative mb-2">
            <img 
              src={`/api/proxy?url=${encodeURIComponent(p.img)}&referer=https://www.mangahere.cc/`}
              className="w-full h-auto shadow-xl"
              loading="lazy"
              alt={`Page ${i + 1}`}
            />
          </div>
        ))}
        
        {!loading && pages.length > 0 && (
           <div className="p-10 text-gray-500 text-center">End of Chapter</div>
        )}
      </div>
    </div>
  );
}
