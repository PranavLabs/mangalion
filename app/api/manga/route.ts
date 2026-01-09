import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- IMPROVED SCRAPER FOR MANGAHERE ---
async function fetchMangaHereWebtoonsImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    // Construct the URL ensuring it hits the first page
    let targetUrl: string;
    if (chapterId.startsWith('http')) {
      targetUrl = chapterId;
    } else {
      const cleanId = chapterId.replace(/\/+$/, '');
      // Ensure we hit the .html endpoint
      targetUrl = cleanId.includes('.html') 
        ? cleanId 
        : `${baseUrl}/manga/${cleanId}/1.html`;
    }

    console.log('[MangaHere Webtoon] Fetching:', targetUrl);

    // Fetch the raw HTML
    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mangahere.cc/',
        'Cookie': 'isAdult=1', // Helps with mature content
      },
      timeout: 10000,
    });

    const allImages: string[] = [];

    // --- STRATEGY 1: EXTRACT FROM JAVASCRIPT (Most Reliable) ---
    // MangaHere often stores images in a variable like "p_urls" or "chapter_images"
    // We look for array patterns containing http links
    const scriptRegex = /var\s+(?:p_urls|chapter_images|pix)\s*=\s*(\[.*?\])/;
    const scriptMatch = data.match(scriptRegex);

    if (scriptMatch && scriptMatch[1]) {
      try {
        // Evaluate the array string safely
        const rawUrls = JSON.parse(scriptMatch[1].replace(/'/g, '"'));
        
        rawUrls.forEach((url: string) => {
           let cleanUrl = url;
           if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
           if (!allImages.includes(cleanUrl)) allImages.push(cleanUrl);
        });

        if (allImages.length > 0) {
           console.log('[MangaHere Webtoon] Found images via Script Variable');
           return allImages.map((img) => ({ img }));
        }
      } catch (e) {
        console.log('[MangaHere Webtoon] Script parsing failed, falling back to regex');
      }
    }

    // --- STRATEGY 2: STRICT DOM REGEX (Fallback) ---
    // If script extraction fails, we parse <img> tags but with STRICT filtering
    console.log('[MangaHere Webtoon] Falling back to strict DOM regex');
    
    // This regex looks for src="URL"
    const srcRegex = /src=["']([^"']+)["']/gi;
    let match;

    while ((match = srcRegex.exec(data)) !== null) {
      let url = match[1];

      // 1. Fix protocol
      if (url.startsWith('//')) url = 'https:' + url;
      
      // 2. STRICT FILTERING: Eliminate "Static" Images
      // Real images usually are in 'store', 'manga', or 'chapter' paths
      // Static images are usually in 'themes', 'assets', 'static', 'images'
      const isUseless = 
          url.includes('/themes/') || 
          url.includes('/assets/') || 
          url.includes('/static/') ||
          url.includes('logo') ||
          url.includes('icon') ||
          url.includes('loading') ||
          url.includes('ads') ||
          url.includes('banner') ||
          url.includes('gif'); // Chapters are rarely .gif

      const isContent = 
          url.includes('mangahere') || 
          url.includes('fmcdn') || 
          url.includes('zjcdn') ||
          url.includes('/store/') || 
          url.includes('/manga/');

      if (!isUseless && isContent) {
        if (!allImages.includes(url)) {
          allImages.push(url);
        }
      }
    }

    // --- STRATEGY 3: Data-Src (Lazy Loading) ---
    const dataSrcRegex = /data-src=["']([^"']+)["']/gi;
    while ((match = dataSrcRegex.exec(data)) !== null) {
       let url = match[1];
       if (url.startsWith('//')) url = 'https:' + url;
       
       // Same filtering logic
       const isUseless = url.includes('/themes/') || url.includes('/assets/') || url.includes('loading');
       if (!isUseless && !allImages.includes(url)) {
         allImages.push(url);
       }
    }

    console.log('[MangaHere Webtoon] Total images found:', allImages.length);
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

        // If Consumet returns empty OR we are using mangahere (which is flaky), try our custom scraper
        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
          console.log('[API] Consumet empty for mangahere, using webtoon scraper');
          const webtoonPages = await fetchMangaHereWebtoonsImages(id);
          return NextResponse.json(webtoonPages);
        }

        return NextResponse.json(pages || []);
      } catch (e: any) {
        console.log('[API] Consumet error, trying webtoon scraper');

        if (providerName === 'mangahere') {
          const webtoonPages = await fetchMangaHereWebtoonsImages(id);
          return NextResponse.json(webtoonPages);
        }

        return NextResponse.json([]);
      }
    }

    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }

    // Trending / Fallback
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
