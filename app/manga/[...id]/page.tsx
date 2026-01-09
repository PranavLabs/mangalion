'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MangaDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const provider = searchParams.get('provider') || 'mangapill';
  const id = Array.isArray(params.id) ? params.id.join('/') : params.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if(!id) return;
    setLoading(true);
    setError('');
    
    fetch(`/api/manga?type=info&id=${encodeURIComponent(id)}&provider=${provider}`)
      .then(r => r.json())
      .then(fetchedData => {
        if (!fetchedData || Object.keys(fetchedData).length === 0) {
            setError('No data found. This manga might be region locked or removed.');
        } else {
            setData(fetchedData);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load info.');
        setLoading(false);
      });
  }, [id, provider]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-blue-500 animate-pulse">Loading Info...</div>;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/" className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700">← Go Back</Link>
      </div>
    );
  }

  const chapters = Array.isArray(data.chapters) ? data.chapters : [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-block px-4 py-2 bg-neutral-800 rounded mb-6 hover:bg-neutral-700 transition">← Back Home</Link>
        
        <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="w-full md:w-1/3">
                <img 
                    src={data.image ? `/api/proxy?url=${encodeURIComponent(data.image)}&source=${provider}` : '/placeholder.png'} 
                    className="w-full rounded-lg shadow-2xl border border-neutral-800" 
                    alt={data.title}
                />
            </div>
            <div className="w-full md:w-2/3">
                <h1 className="text-4xl font-bold mb-4">{data.title}</h1>
                <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                    {data.description || 'No description available.'}
                </p>
                <div className="flex gap-2">
                    <span className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded border border-blue-900 text-sm">
                        {data.status || 'Unknown Status'}
                    </span>
                    <span className="bg-neutral-800 text-gray-400 px-3 py-1 rounded border border-neutral-700 uppercase text-sm">
                        {provider}
                    </span>
                </div>
            </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 border-b border-neutral-800 pb-2">Chapters ({chapters.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {chapters.map((c: any) => (
                <Link 
                    key={c.id} 
                    href={`/read/${c.id}?provider=${provider}`} 
                    className="p-3 bg-neutral-900 border border-neutral-800 rounded hover:border-blue-600 hover:text-blue-400 transition truncate text-sm text-gray-300"
                >
                    {c.title || `Chapter ${c.chapterNumber}`}
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
