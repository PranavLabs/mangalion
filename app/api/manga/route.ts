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
      },
      timeout: 15000,
    });

    console.log('[MangaHere] Got HTML, length:', data.length);

    // Extract image URLs from the HTML
    // Mangahere stores images in script with a list or in img data attributes

    // Method 1: Look for window object data or script variables
    // Pattern: window.dm_imageURL = ['url1', 'url2', ...]
    let imageMatch = data.match(/window\.dm_imageURL\s*=\s*(\[.*?\])/s);
    if (!imageMatch) {
      imageMatch = data.match(/dm_imageURL\s*=\s*(\[.*?\])/s);
    }
    if (!imageMatch) {
      imageMatch = data.match(/var\s+image\s*=\s*(\[.*?\])/s);
    }

    if (imageMatch && imageMatch[1]) {
      console.log('[MangaHere] Found image array in script');
      try {
        // Clean the array string
        let arrayStr = imageMatch[1];
        // Try to eval it
        const images = eval('(' + arrayStr + ')');
        if (Array.isArray(images) && images.length > 0) {
          console.log('[MangaHere] Extracted', images.length, 'images');
          return images.map((img: string) => ({
            img: img.startsWith('//') ? `https:${img}` : img,
          }));
        }
      } catch (e) {
        console.log('[MangaHere] Array eval failed');
      }
    }

    // Method 2: Extract from all img tags with specific patterns
    console.log('[MangaHere] Extracting from img tags');
    const imgRegex = /<img[^>]+src=["']([^"']*jpg[^"']*)["'][^>]*>/gi;
    const matches = [...data.matchAll(imgRegex)];
    
    if (matches.length > 0) {
      console.log('[MangaHere] Found', matches.length, 'jpg images');
      const images = matches
        .map((m) => {
          let url = m[1];
          if (url.startsWith('//')) {
            return `https:${url}`;
          } else if (!url.startsWith('http')) {
            return `https://${url}`;
          }
          return url;
        })
        .filter((url) => url && (url.includes('zjcdn') || url.includes('mangahere') || url.includes('fmcdn')));
      
      if (images.length > 0) {
        return images.map((img) => ({ img }));
      }
    }

    // Method 3: Look in data attributes
    console.log('[MangaHere] Looking in data attributes');
    const dataRegex = /data-original=["']([^"']+)["']/g;
    const dataMatches = [...data.matchAll(dataRegex)];
    
    if (dataMatches.length > 0) {
      console.log('[MangaHere] Found in data-original');
      return dataMatches
        .map((m) => {
          let url = m[1];
          return url.startsWith('//') ? `https:${url}` : url;
        })
        .map((img) => ({ img }));
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
