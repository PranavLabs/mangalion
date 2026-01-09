import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- CUSTOM MANGAHERE SCRAPER (Fixes Webtoons) ---
async function fetchMangaHereImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    // Build the chapter URL - the ID from Consumet is usually just the relative path
    let targetUrl = chapterId.startsWith('http')
      ? chapterId
      : `${baseUrl}/${chapterId}`;

    // IMPORTANT: Don't add /1.html - Mangahere webtoons are single-page
    // Just ensure .html extension exists
    if (!targetUrl.endsWith('.html')) {
      targetUrl = targetUrl.replace(/\/+$/, '') + '.html';
    }

    console.log('[MangaHere] Attempting:', targetUrl);

    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
      },
      timeout: 10000,
    });

    console.log('[MangaHere] Got response, HTML length:', data.length);

    // Try multiple patterns to extract images
    const patterns = [
      // Pattern 1: var image = [...]
      /var\s+image\s*=\s*(\[[^\]]+\])/,
      // Pattern 2: images variable
      /var\s+images\s*=\s*(\[[^\]]+\])/,
      // Pattern 3: dm_imageURL
      /var\s+dm_imageURL\s*=\s*(\[[^\]]+\])/,
      // Pattern 4: image array in object
      /"image"\s*:\s*(\[[^\]]+\])/,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = data.match(patterns[i]);
      if (match && match[1]) {
        console.log(`[MangaHere] Matched pattern ${i + 1}`);
        try {
          const rawImages = eval(match[1]);
          if (Array.isArray(rawImages) && rawImages.length > 0) {
            console.log(`[MangaHere] Extracted ${rawImages.length} images`);
            return rawImages.map((img: string) => ({
              img: img.startsWith('//') ? `https:${img}` : img,
            }));
          }
        } catch (evalError) {
          console.log(`[MangaHere] Pattern ${i + 1} eval failed`);
          continue;
        }
      }
    }

    // Last resort: Extract img tags
    console.log('[MangaHere] Trying img tag extraction');
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const matches = [...data.matchAll(imgRegex)];
    
    const imageUrls = matches
      .map((m) => m[1])
      .filter((url) => url && (url.includes('jpg') || url.includes('png') || url.includes('webp')))
      .map((url) => url.startsWith('//') ? `https:${url}` : url)
      .filter((v, i, a) => a.indexOf(v) === i); // dedupe

    if (imageUrls.length > 0) {
      console.log(`[MangaHere] Extracted ${imageUrls.length} images from img tags`);
      return imageUrls.map((img) => ({ img }));
    }

    console.log('[MangaHere] No images found');
    return [];
  } catch (e: any) {
    console.error('[MangaHere] Error:', e.response?.status, e.message);
    if (e.response?.status === 404) {
      console.error('[MangaHere] Chapter returns 404 - may be removed or URL format is wrong');
    }
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

        // If library returns empty array, try manual fix for Mangahere
        if (!pages || pages.length === 0) {
          if (providerName === 'mangahere') {
            console.log('[API] Consumet empty, trying manual for:', id);
            const manualPages = await fetchMangaHereImages(id);
            return NextResponse.json(manualPages);
          }
        }

        return NextResponse.json(pages);
      } catch (e) {
        // If library crashes, try manual fix
        if (providerName === 'mangahere') {
          console.log('[API] Consumet crashed, trying manual for:', id);
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
