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
    
    // 4. Trending/Popular
    try {
        // FIX: We cast to 'any' to bypass the TypeScript error for MangaPill
        const popular = await (provider as any).fetchTrending();
        return NextResponse.json(popular);
    } catch (e) {
        // Fallback: If fetchTrending doesn't exist (like on MangaPill), we search for a popular genre
        const fallback = await provider.search('Action');
        return NextResponse.json(fallback);
    }
    
  } catch (err) {
    console.error(`Error with ${providerName}:`, err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
