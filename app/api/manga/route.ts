import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';

// Initialize providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangakakalot: new MANGA.Mangakakalot(),
  // NEW: Added MangaHere, Removed MangaDex
  mangahere: new MANGA.MangaHere(), 
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');
  
  // Default to 'mangapill'
  const providerName = searchParams.get('provider') || 'mangapill';
  const provider = providers[providerName as keyof typeof providers] || providers.mangapill;

  try {
    if (type === 'info' && id) {
      const info = await provider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }
    
    if (type === 'chapter' && id) {
      const pages = await provider.fetchChapterPages(id);
      return NextResponse.json(pages);
    }
    
    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }
    
    // Trending Logic
    try {
        const popular = await (provider as any).fetchTrending();
        return NextResponse.json(popular);
    } catch (e) {
        const fallback = await provider.search('Isekai');
        return NextResponse.json(fallback);
    }
    
  } catch (err) {
    console.error(`Error with ${providerName}:`, err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
