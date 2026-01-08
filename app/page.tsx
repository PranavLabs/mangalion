'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchManga = async (q?: string) => {
    const res = await fetch(q ? `/api/manga?q=${q}` : '/api/manga');
    const data = await res.json();
    setMangaList(data.results || []); 
  };

  useEffect(() => { fetchManga(); }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex gap-2 mb-8">
        <input 
          className="flex-1 p-3 bg-gray-800 rounded border border-gray-700 text-white"
          placeholder="Search Manga (e.g. One Piece)"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchManga(search)}
        />
        <button onClick={() => fetchManga(search)} className="bg-blue-600 px-6 rounded text-white font-bold">GO</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mangaList.map((m) => (
          <Link href={`/manga/${m.id}`} key={m.id} className="group">
            <div className="relative aspect-[2/3] overflow-hidden rounded mb-2">
              <img 
                /* UPDATED: Uses proxy with MangaHere referer */
                src={`/api/proxy?url=${encodeURIComponent(m.image)}&referer=https://www.mangahere.cc/`} 
                className="object-cover w-full h-full group-hover:scale-105 transition"
                alt={m.title}
              />
            </div>
            <p className="text-white text-sm truncate">{m.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
