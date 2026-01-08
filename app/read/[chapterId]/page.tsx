'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Reader() {
  const { chapterId } = useParams();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(chapterId) {
        fetch(`/api/manga?type=chapter&id=${chapterId}`)
            .then(r => r.json())
            .then(data => {
                setPages(data);
                setLoading(false);
            });
    }
  }, [chapterId]);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center">
       {/* Simple Navbar */}
       <div className="w-full bg-gray-900 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
            <Link href="/" className="text-white font-bold">MangaReader</Link>
            <span className="text-gray-400 text-sm">{loading ? 'Loading...' : `Page 1 / ${pages.length}`}</span>
       </div>

      <div className="w-full max-w-3xl flex flex-col gap-0 pb-20">
        {pages.map((p, i) => (
          <img 
            key={i}
            src={`/api/proxy?url=${encodeURIComponent(p.img)}&referer=https://www.mangahere.cc/`}
            className="w-full h-auto"
            loading="lazy"
            alt={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
