'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function MangaDetails() {
  const params = useParams();
  
  // FIX: Handle IDs with slashes (like "2/one-piece")
  const id = Array.isArray(params.id) ? params.id.join('/') : params.id;
  
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if(!id) return;
    // FIX: Encode the ID so it passes safely to our API
    fetch(`/api/manga?type=info&id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <div className="text-white p-10 text-center animate-pulse">Loading info...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <Link href="/" className="inline-block px-4 py-2 bg-gray-800 rounded mb-6 hover:bg-gray-700">← Back Home</Link>
      
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-full md:w-1/3">
            <img 
                src={`/api/proxy?url=${encodeURIComponent(data.image)}&referer=https://mangapill.com/`} 
                className="w-full rounded-lg shadow-2xl" 
                alt={data.title}
            />
        </div>
        <div className="w-full md:w-2/3">
          <h1 className="text-4xl font-bold mb-4">{data.title}</h1>
          <p className="text-gray-300 leading-relaxed mb-4">{data.description}</p>
          <div className="flex gap-4 text-sm text-gray-400">
            {/* MangaPill often doesn't give status/date, so we hide them if missing */}
            {data.status && <span>Status: <b className="text-white">{data.status}</b></span>}
            {data.releaseDate && <span>Released: <b className="text-white">{data.releaseDate}</b></span>}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">Chapters</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {data.chapters?.map((c: any) => (
          <Link key={c.id} href={`/read/${c.id}`} className="p-3 bg-gray-800 rounded hover:bg-blue-600 transition truncate text-sm">
            {c.title || `Chapter ${c.chapterNumber}`}
          </Link>
        ))}
      </div>
    </div>
  );
}
