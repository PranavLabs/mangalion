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

    // Normalize chapter URL
    let targetUrl = chapterId.startsWith('http')
      ? chapterId
      : `${baseUrl}/${chapterId}`;

    // CRITICAL FIX: Normalize to /1.html for webtoons
    if (!targetUrl.endsWith('.html')) {
      targetUrl = targetUrl.replace(/\/+$/, '') + '/1.html';
    }

    console.log('[MangaHere Scraper] Fetching:', targetUrl);

    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
      },
      timeout: 10000,
    });

    console.log('[MangaHere Scraper] HTML length:', data.length);

    // Multiple regex patterns to try
    const patterns = [
      // Pattern 1: var image = [...]
      /var\s+image\s*=\s*(\[[^\]]+\])/,
      // Pattern 2: "image":[ ... ]
      /"image"\s*:\s*(\[[^\]]+\])/,
      // Pattern 3: images = [...]
      /images\s*=\s*(\[[^\]]+\])/,
      // Pattern 4: var dm_imageURL = [...]
      /var\s+dm_imageURL\s*=\s*(\[[^\]]+\])/,
      // Pattern 5: Look for img tags with src
      /<img[^>]+src=["']([^"']+)["'][^>]*class=["']reader[^"']*["'][^>]*>/g,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      
      if (pattern.global) {
        // For regex with global flag (image tags)
        const matches = [...data.matchAll(pattern)];
        if (matches.length > 0) {
          console.log(`[MangaHere Scraper] Found ${matches.length} images with pattern ${i + 1}`);
          return matches.map((match) => ({
            img: match[1].startsWith('//') ? `https:${match[1]}` : match[1],
          }));
        }
      } else {
        // For regular patterns
        const match = data.match(pattern);
        if (match && match[1]) {
          console.log(`[MangaHere Scraper] Matched pattern ${i + 1}`);
          try {
            const rawImages = eval(match[1]);
            if (Array.isArray(rawImages) && rawImages.length > 0) {
              console.log(`[MangaHere Scraper] Extracted ${rawImages.length} images`);
              return rawImages.map((img: string) => ({
                img: img.startsWith('//') ? `https:${img}` : img,
              }));
            }
          } catch (evalError) {
            console.log(`[MangaHere Scraper] Pattern ${i + 1} eval failed, trying next...`);
            continue;
          }
        }
      }
    }

    // Last resort: Extract all image URLs from src attributes
    console.log('[MangaHere Scraper] Trying to extract img src attributes');
    const srcMatches = [...data.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
    if (srcMatches.length > 0) {
      const uniqueImages = new Set<string>();
      srcMatches.forEach((match) => {
        let url = match[1];
        if (url.includes('jpg') || url.includes('png') || url.includes('webp')) {
          if (url.startsWith('//')) {
            url = `https:${url}`;
          }
          uniqueImages.add(url);
        }
      });
      if (uniqueImages.size > 0) {
        console.log(`[MangaHere Scraper] Extracted ${uniqueImages.size} images from src`);
        return Array.from(uniqueImages).map((img) => ({ img }));
      }
    }

    console.log('[MangaHere Scraper] No images found with any pattern');
    return [];
  } catch (e) {
    console.error('[MangaHere Scraper] Error:', e);
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

        // If library returns empty array (common for webtoons), try manual fix
        if (!pages || pages.length === 0) {
          if (providerName === 'mangahere') {
            console.log('[API] Consumet returned empty, trying manual scraper for:', id);
            const manualPages = await fetchMangaHereImages(id);
            return NextResponse.json(manualPages);
          }
        }

        return NextResponse.json(pages);
      } catch (e) {
        console.log('[API] Consumet crashed, error:', e);
        // If library CRASHES, try manual fix immediately
        if (providerName === 'mangahere') {
          console.log('[API] Trying manual scraper for:', id);
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
