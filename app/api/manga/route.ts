import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';

// MangaPill is currently the most stable alternative
const mangaProvider = new MANGA.MangaPill();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');

  try {
    if (type === 'info' && id) {
      const info = await mangaProvider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }
    if (type === 'chapter' && id) {
      const pages = await mangaProvider.fetchChapterPages(id);
      return NextResponse.json(pages);
    }
    if (query) {
      const results = await mangaProvider.search(query);
      return NextResponse.json(results);
    }
    // MangaPill doesn't have a generic trending endpoint in some versions, 
    // so we search for "One Piece" or "Naruto" to fill the home page with valid data.
    const popular = await mangaProvider.search('One Piece'); 
    return NextResponse.json(popular);
    
  } catch (err) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
