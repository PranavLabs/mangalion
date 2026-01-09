'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MangaDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  // SAFELY handle the ID:
  const id = Array.isArray(params.id) ? params.id.join('/') : params.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id) return;
    setLoading(true);
    
    fetch(`/api/manga?type=info&id=${encodeURIComponent(id)}&provider=${provider}`)
      .then(r => r.json())
      .then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, provider]);

  // CRITICAL: Return loading state immediately if data is null
  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        <div className="text-xl animate-pulse">Loading Info...</div>
      </div>
    );
  }

  // CRITICAL: Check if chapters exist before mapping
  const chapterList = Array.isArray(data.chapters) ? data.chapters : [];

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <Link href="/" className="inline-block px-4 py-2 bg-neutral-800 rounded mb-6 hover:bg-neutral-700 transition">
        ← Back Home
      </Link>
      
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-full md:w-1/3">
            {/* Safe Image Loading */}
            <img 
                src={data.image ? `/api/proxy?url=${encodeURIComponent(data.image)}` : '/placeholder.png'} 
                className="w-full rounded-lg shadow-2xl border border-neutral-800" 
                alt={data.title || 'Manga Cover'}
            />
        </div>
        <div className="w-full md:w-2/3">
          <h1 className="text-4xl font-bold mb-4">{data.title || 'Unknown Title'}</h1>
          <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
            {data.description || 'No description available.'}
          </p>
          <div className="flex gap-4 text-sm text-gray-400">
             <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded">
                {data.status || 'Unknown Status'}
             </span>
             <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded">
               {provider.toUpperCase()}
             </span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b border-neutral-800 pb-2">
        Chapters ({chapterList.length})
      </h2>
      
      {chapterList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {chapterList.map((c: any) => (
            <Link 
              key={c.id} 
              href={`/read/${c.id}?provider=${provider}`} 
              className="p-3 bg-neutral-800 rounded hover:bg-blue-600 transition truncate text-sm text-gray-300 hover:text-white"
            >
              {c.title || `Chapter ${c.chapterNumber}`}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 italic">No chapters found for this provider.</div>
      )}
    </div>
  );
}
