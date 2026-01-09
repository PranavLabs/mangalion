import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- IMPROVED MANGAHERE SCRAPER (No Puppeteer) ---
async function fetchMangaHereImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    let targetUrl: string;
    if (chapterId.startsWith('http')) {
      targetUrl = chapterId;
    } else {
      const cleanId = chapterId.replace(/\/+$/, '');
      targetUrl = `${baseUrl}/manga/${cleanId}/1.html`;
    }

    console.log('[MangaHere] Fetching:', targetUrl);

    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
    });

    console.log('[MangaHere] Got HTML, length:', data.length);

    const images: string[] = [];

    // Method 1: Extract from img src attributes (these are in the HTML)
    // Look for: src="https://fmcdn.mangahere.com/..." or src="https://zjcdn.mangahere.org/..."
    const imgSrcRegex = /src=["']([^"']*(?:fmcdn|zjcdn)[^"']*(?:jpg|png|webp|jpeg)[^"']*)["']/gi;
    let match;
    
    while ((match = imgSrcRegex.exec(data)) !== null) {
      let url = match[1];
      if (!url.includes('loading') && !url.includes('nopicture')) {
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    }

    if (images.length > 0) {
      console.log('[MangaHere] Found', images.length, 'images from src');
      return images.map((img) => ({ img }));
    }

    // Method 2: Extract from data-src (lazy loading)
    const dataSrcRegex = /data-src=["']([^"']*(?:fmcdn|zjcdn)[^"']*(?:jpg|png|webp|jpeg)[^"']*)["']/gi;
    while ((match = dataSrcRegex.exec(data)) !== null) {
      let url = match[1];
      if (!url.includes('loading')) {
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    }

    if (images.length > 0) {
      console.log('[MangaHere] Found', images.length, 'images from data-src');
      return images.map((img) => ({ img }));
    }

    // Method 3: Extract from data-original (another lazy loading variant)
    const dataOriginalRegex = /data-original=["']([^"']*(?:fmcdn|zjcdn)[^"']*(?:jpg|png|webp|jpeg)[^"']*)["']/gi;
    while ((match = dataOriginalRegex.exec(data)) !== null) {
      let url = match[1];
      if (!images.includes(url)) {
        images.push(url);
      }
    }

    if (images.length > 0) {
      console.log('[MangaHere] Found', images.length, 'images from data-original');
      return images.map((img) => ({ img }));
    }

    console.log('[MangaHere] No images found');
    return [];
  } catch (e: any) {
    console.error('[MangaHere] Error:', e.response?.status || e.code, e.message);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');
  const providerName = searchParams.get('provider') || 'mangapill';
  const provider =
    providers[providerName as keyof typeof providers] || providers.mangapill;

  try {
    if (type === 'info' && id) {
      const info = await provider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }

    if (type === 'chapter' && id) {
      try {
        const pages = await provider.fetchChapterPages(id);

        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
          console.log('[API] Consumet empty, trying manual scraper');
          const manualPages = await fetchMangaHereImages(id);
          return NextResponse.json(manualPages);
        }

        return NextResponse.json(pages);
      } catch (e) {
        if (providerName === 'mangahere') {
          console.log('[API] Consumet error, trying manual scraper');
          const manualPages = await fetchMangaHereImages(id);
          return NextResponse.json(manualPages);
        }
        return NextResponse.json([]);
      }
    }

    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }

    try {
      const popular = await (provider as any).fetchTrending();
      return NextResponse.json(popular);
    } catch (e) {
      const fallback = await provider.search('Isekai');
      return NextResponse.json(fallback);
    }
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Fetch failed' },
      { status: 500 }
    );
  }
}


