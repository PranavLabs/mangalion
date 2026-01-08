'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function MangaDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if(id) fetch(`/api/manga?type=info&id=${id}`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) return <div className="text-white p-10 text-center">Loading...</div>;

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
