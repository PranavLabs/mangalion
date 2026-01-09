import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- ROBUST SCRAPER FOR MANGAHERE ---
async function fetchMangaHereWebtoonsImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    // 1. Construct the URL (Ensure we hit .html)
    let targetUrl: string;
    if (chapterId.startsWith('http')) {
      targetUrl = chapterId;
    } else {
      const cleanId = chapterId.replace(/\/+$/, '');
      targetUrl = cleanId.includes('.html') 
        ? cleanId 
        : `${baseUrl}/manga/${cleanId}/1.html`;
    }

    console.log('[MangaHere Webtoon] Fetching:', targetUrl);

    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
        'Cookie': 'isAdult=1', 
      },
      timeout: 10000,
    });

    const allImages: string[] = [];

    // --- STRATEGY 1: SCRIPT VARIABLE (Primary) ---
    // Matches "var p_urls = [...]" or "var chapter_images = [...]" even with newlines
    const scriptRegex = /(?:var|let|const)\s+(?:p_urls|chapter_images|pix|urls)\s*=\s*(\[[\s\S]*?\])/;
    const scriptMatch = data.match(scriptRegex);

    if (scriptMatch && scriptMatch[1]) {
      try {
        // Clean the array string (remove trailing commas/semicolons) and parse
        const cleanArray = scriptMatch[1].replace(/;\s*$/, '');
        // Use a safe eval-like parse (JSON.parse might fail on single quotes)
        const rawUrls = eval(`(${cleanArray})`); 
        
        if (Array.isArray(rawUrls) && rawUrls.length > 0) {
           console.log('[MangaHere Webtoon] Found', rawUrls.length, 'images via Script');
           
           rawUrls.forEach((url: string) => {
             let cleanUrl = url;
             if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
             // MangaHere script images are usually reliable, but we still fix protocol
             if (!allImages.includes(cleanUrl)) allImages.push(cleanUrl);
           });
           
           return allImages.map((img) => ({ img }));
        }
      } catch (e) {
        console.log('[MangaHere Webtoon] Script parsing failed, trying DOM fallback');
      }
    }

    // --- STRATEGY 2: STRICT DOM SCRAPING (Fallback) ---
    // This runs if the script method failed.
    console.log('[MangaHere Webtoon] Falling back to Strict DOM Loop');

    // We will loop pages 1 to X until we hit a duplicate or 404
    let pageNum = 1;
    let hasPages = true;
    let consecutiveEmptyPages = 0;

    while (hasPages && pageNum <= 150) { // Safety limit 150 pages
       // Only fetch if it's NOT page 1 (we already have page 1 data)
       let pageData = data;
       let currentUrl = targetUrl;

       if (pageNum > 1) {
           currentUrl = targetUrl.replace(/\/1\.html.*/, `/${pageNum}.html`);
           try {
             const res = await axios.get(currentUrl, {
                 headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.mangahere.cc/'
                 },
                 timeout: 5000
             });
             pageData = res.data;
           } catch(e) {
             console.log(`[MangaHere Webtoon] Page ${pageNum} failed/404. Stopping.`);
             break;
           }
       }

       // Strict Regex for images
       const srcRegex = /src=["']([^"']+)["']/gi;
       let match;
       let foundOnThisPage = 0;

       while ((match = srcRegex.exec(pageData)) !== null) {
          let url = match[1];

          // 1. Protocol Fix
          if (url.startsWith('//')) url = 'https:' + url;
          if (!url.startsWith('http')) continue; // Skip relative paths that aren't protocol-relative

          // 2. STRICT ALLOWLIST (This fixes your issue!)
          // Real chapter images ALWAYS contain '/store/manga/' or 'fmcdn' or 'zjcdn'
          // We strictly REJECT anything else.
          const isRealMangaImage = 
              (url.includes('/store/manga/') || url.includes('fmcdn') || url.includes('zjcdn')) &&
              !url.includes('logo') &&
              !url.includes('avatar') &&
              !url.includes('thumb');

          if (isRealMangaImage) {
              if (!allImages.includes(url)) {
                  allImages.push(url);
                  foundOnThisPage++;
                  consecutiveEmptyPages = 0;
              }
          }
       }

       // Stop if we scan 3 pages in a row with no new images (avoids infinite loops)
       if (foundOnThisPage === 0) {
           consecutiveEmptyPages++;
       }
       if (consecutiveEmptyPages > 2) {
           hasPages = false;
       }

       pageNum++;
    }

    console.log('[MangaHere Webtoon] Total images:', allImages.length);
    return allImages.map((img) => ({ img }));

  } catch (e: any) {
    console.error('[MangaHere Webtoon] Error:', e.message);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');
  const providerName = searchParams.get('provider') || 'mangapill';
  
  // Select Provider
  const provider = providers[providerName as keyof typeof providers] || providers.mangapill;

  try {
    // 1. INFO
    if (type === 'info' && id) {
      const info = await provider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }

    // 2. CHAPTERS (With Fallback)
    if (type === 'chapter' && id) {
      try {
        const pages = await provider.fetchChapterPages(id);
        
        // If library fails or returns empty for MangaHere, use our custom scraper
        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
             console.log('[API] Empty result, switching to custom scraper...');
             const customPages = await fetchMangaHereWebtoonsImages(id);
             return NextResponse.json(customPages);
        }
        return NextResponse.json(pages || []);

      } catch (e) {
        // Library crashed, use custom scraper
        if (providerName === 'mangahere') {
            console.log('[API] Library error, switching to custom scraper...');
            const customPages = await fetchMangaHereWebtoonsImages(id);
            return NextResponse.json(customPages);
        }
        return NextResponse.json([]);
      }
    }

    // 3. SEARCH
    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }

    // 4. TRENDING
    try {
      const popular = await (provider as any).fetchTrending();
      return NextResponse.json(popular);
    } catch (e) {
      const fallback = await provider.search('Isekai');
      return NextResponse.json(fallback);
    }

  } catch (err) {
    console.error('[API] Global Error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
