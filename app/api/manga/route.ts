import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';

// MangaHere is a massive aggregator that is currently stable
const mangaProvider = new MANGA.MangaHere();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');

  try {
    // 1. Fetch Manga Info
    if (type === 'info' && id) {
      const info = await mangaProvider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }
    
    // 2. Fetch Chapter Pages
    if (type === 'chapter' && id) {
      const pages = await mangaProvider.fetchChapterPages(id);
      return NextResponse.json(pages);
    }
    
    // 3. Search
    if (query) {
      const results = await mangaProvider.search(query);
      return NextResponse.json(results);
    }
    
    // 4. Default: Search for something popular to fill the home page
    // MangaHere doesn't always have a "trending" endpoint, so we search "Action"
    const popular = await mangaProvider.search('Action'); 
    return NextResponse.json(popular);
    
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
