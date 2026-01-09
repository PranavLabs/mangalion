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

    // Method 1: Look for the actual manga image array
    // Mangahere stores images in: var dm_imageURL = [...] or similar
    const patterns = [
      /var\s+dm_imageURL\s*=\s*(\[[^\]]*\])/,  // Most common for current Mangahere
      /var\s+image\s*=\s*(\[[^\]]*\])/,        // Alternative format
      /var\s+images\s*=\s*(\[[^\]]*\])/,       // Another alternative
      /['"]image['"]\s*:\s*(\[[^\]]*\])/,      // JSON format
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = data.match(patterns[i]);
      if (match && match[1]) {
        console.log('[MangaHere] Found pattern', i + 1, 'for image array');
        try {
          // Clean up the array string and evaluate it
          let arrayStr = match[1];
          // Remove any trailing commas and fix quotes if needed
          arrayStr = arrayStr.replace(/,\s*\]/g, ']');
          
          const rawImages = eval(arrayStr);
          
          if (Array.isArray(rawImages) && rawImages.length > 0) {
            // Filter out empty strings and non-image URLs
            const validImages = rawImages.filter((img: any) => {
              const url = String(img);
              return url && (url.includes('jpg') || url.includes('png') || url.includes('webp') || url.includes('jpeg'));
            });

            if (validImages.length > 0) {
              console.log('[MangaHere] Extracted', validImages.length, 'valid images from pattern', i + 1);
              return validImages.map((img: any) => {
                let url = String(img);
                if (url.startsWith('//')) {
                  url = `https:${url}`;
                } else if (!url.startsWith('http')) {
                  url = `https://${url}`;
                }
                return { img: url };
              });
            }
          }
        } catch (e) {
          console.log('[MangaHere] Pattern', i + 1, 'eval failed:', e);
          continue;
        }
      }
    }

    // Method 2: Extract images from img tags in the reader area specifically
    console.log('[MangaHere] Trying img tag extraction from reader');
    const readerImgRegex = /<img[^>]+data-(?:src|original)=["']([^"']+)["'][^>]*>/g;
    const imgMatches = [...data.matchAll(readerImgRegex)];
    
    if (imgMatches.length > 0) {
      console.log('[MangaHere] Found', imgMatches.length, 'images with data-src/data-original');
      return imgMatches.map((match) => {
        let url = match[1];
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        return { img: url };
      });
    }

    // Method 3: Fallback to all img src (but filter out UI images)
    console.log('[MangaHere] Fallback to all img tags');
    const allImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const allMatches = [...data.matchAll(allImgRegex)];
    const images: string[] = [];

    allMatches.forEach((match) => {
      const src = match[1];
      // Filter out static/UI images
      if (
        src &&
        (src.includes('.jpg') || src.includes('.png') || src.includes('.webp')) &&
        !src.includes('static.mangahere.cc') &&
        !src.includes('logo') &&
        !src.includes('icon') &&
        !src.includes('avatar') &&
        !src.includes('star-') &&
        !src.includes('nopicture')
      ) {
        let cleanUrl = src.startsWith('//') ? `https:${src}` : src;
        if (!images.includes(cleanUrl)) {
          images.push(cleanUrl);
        }
      }
    });

    if (images.length > 0) {
      console.log('[MangaHere] Extracted', images.length, 'images from fallback');
      return images.map((img) => ({ img }));
    }

    console.log('[MangaHere] No valid images found');
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
