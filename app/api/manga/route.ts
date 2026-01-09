import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';

// Initialize all available providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  comick: new MANGA.ComicK(),
  mangadex: new MANGA.MangaDex(),
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');
  
  // DEFAULT to 'mangapill' if no provider is selected
  const providerName = searchParams.get('provider') || 'mangapill';
  const provider = providers[providerName as keyof typeof providers] || providers.mangapill;

  try {
    // 1. Get Details
    if (type === 'info' && id) {
      const info = await provider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }
    
    // 2. Get Chapter Pages
    if (type === 'chapter' && id) {
      const pages = await provider.fetchChapterPages(id);
      return NextResponse.json(pages);
    }
    
    // 3. Search
    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }
    
    // 4. Trending/Popular (Fallback logic varies by provider)
    try {
        // ComicK and MangaDex have good trending endpoints
        const popular = await provider.fetchTrending();
        return NextResponse.json(popular);
    } catch (e) {
        // Fallback for providers that crash on trending
        const fallback = await provider.search('Isekai');
        return NextResponse.json(fallback);
    }
    
  } catch (err) {
    console.error(`Error with ${providerName}:`, err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
