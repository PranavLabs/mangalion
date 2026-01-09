import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- MANGAHERE SCRAPER (Fixes Webtoons/Manhwa) ---
async function fetchMangaHereImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    // chapterId comes as "solo_leveling/c200" -> needs "manga/solo_leveling/c200/1.html"
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
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
      },
      timeout: 15000,
    });

    console.log('[MangaHere] Got HTML, length:', data.length);

    // Extract images from JavaScript variable: var image = [...]
    const imageMatch = data.match(/var\s+image\s*=\s*(\[[^\]]+\])/);
    
    if (imageMatch && imageMatch[1]) {
      console.log('[MangaHere] Found image array');
      try {
        const rawImages = eval(imageMatch[1]);
        if (Array.isArray(rawImages) && rawImages.length > 0) {
          console.log('[MangaHere] Extracted', rawImages.length, 'images');
          return rawImages.map((img: string) => ({
            img: img.startsWith('//') ? `https:${img}` : img,
          }));
        }
      } catch (e) {
        console.log('[MangaHere] Eval failed');
      }
    }

    // Fallback: Extract from img src attributes
    console.log('[MangaHere] Trying img tag extraction');
    const imgMatches = [...data.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
    const images: string[] = [];

    imgMatches.forEach((match) => {
      const src = match[1];
      if (src && (src.includes('.jpg') || src.includes('.png') || src.includes('.webp'))) {
        images.push(src.startsWith('//') ? `https:${src}` : src);
      }
    });

    if (images.length > 0) {
      console.log('[MangaHere] Extracted', images.length, 'images from img tags');
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
        // Try Standard Library First
        const pages = await provider.fetchChapterPages(id);

        // If library returns empty array, try manual scraper for Mangahere
        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
          console.log('[API] Consumet empty, trying manual scraper');
          const manualPages = await fetchMangaHereImages(id);
          return NextResponse.json(manualPages);
        }

        return NextResponse.json(pages);
      } catch (e) {
        // If library crashes, try manual scraper for Mangahere
        if (providerName === 'mangahere') {
          console.log('[API] Consumet crashed, trying manual scraper');
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

