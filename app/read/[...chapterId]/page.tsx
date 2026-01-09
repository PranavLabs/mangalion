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
    fetch(`/api/manga?type=chapter&id=${encodeURIComponent(chapterId)}&provider=${provider}`)
      .then(r => r.json())
      .then(data => {
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => setLoading(false));
  }, [chapterId, provider]);

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center">
       <div className="w-full bg-neutral-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
            <Link href="/" className="text-white font-bold">← Back</Link>
            <span className="text-gray-400 text-sm">
                {loading ? 'Loading...' : `${provider} • ${pages.length} Pages`}
            </span>
       </div>

      <div className="w-full max-w-4xl flex flex-col items-center pb-20 bg-black">
        {pages.map((p, i) => (
          // CLEAN IMAGE URL
          <img 
            key={i}
            src={`/api/proxy?url=${encodeURIComponent(p.img)}`}
            className="w-full h-auto mb-1"
            loading="lazy"
            alt={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
