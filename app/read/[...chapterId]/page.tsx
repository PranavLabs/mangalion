'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const params = useParams();
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId.join('/') : params.chapterId;
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!chapterId) return;
    fetch(`/api/manga?type=chapter&id=${encodeURIComponent(chapterId)}`)
      .then(r => r.json())
      .then(data => {
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => setLoading(false));
  }, [chapterId]);

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center">
       <div className="w-full bg-neutral-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
            <Link href="/" className="text-white font-bold">← Back</Link>
            <span className="text-gray-400 text-sm">{loading ? 'Loading...' : `Pages: ${pages.length}`}</span>
       </div>

      <div className="w-full max-w-4xl flex flex-col items-center pb-20 bg-black">
        {pages.map((p, i) => (
          <img 
            key={i}
            src={`/api/proxy?url=${encodeURIComponent(p.img)}&referer=https://mangapill.com/`}
            className="w-full h-auto mb-1"
            loading="lazy"
            alt={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
