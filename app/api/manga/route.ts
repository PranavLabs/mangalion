import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// ... (Keep the fetchMangaHereWebtoonsImages function here exactly as before) ...
// (I am omitting the scraper function code to save space, but DO NOT DELETE IT from your file)
async function fetchMangaHereWebtoonsImages(chapterId: string) {
    // ... Paste your existing Webtoon Scraper code here ...
    try {
        const baseUrl = 'https://www.mangahere.cc';
        let targetUrl: string;
        if (chapterId.startsWith('http')) {
             targetUrl = chapterId;
        } else {
             const cleanId = chapterId.replace(/\/+$/, '');
             targetUrl = cleanId.includes('.html') ? cleanId : `${baseUrl}/manga/${cleanId}/1.html`;
        }
        // ... (rest of scraper logic) ...
        const { data } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.mangahere.cc/',
                'Cookie': 'isAdult=1',
            },
            timeout: 10000,
        });
        const allImages: string[] = [];
        const scriptRegex = /var\s+(?:p_urls|chapter_images|pix)\s*=\s*(\[.*?\])/;
        const scriptMatch = data.match(scriptRegex);
        if (scriptMatch && scriptMatch[1]) {
             const rawUrls = JSON.parse(scriptMatch[1].replace(/'/g, '"'));
             rawUrls.forEach((url: string) => {
                 let cleanUrl = url;
                 if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
                 if (!allImages.includes(cleanUrl)) allImages.push(cleanUrl);
             });
             return allImages.map((img) => ({ img }));
        }
        // Fallback regex (simplified for brevity, use your full version)
        const srcRegex = /src=["']([^"']+)["']/gi;
        let match;
        while ((match = srcRegex.exec(data)) !== null) {
             let url = match[1];
             if (url.startsWith('//')) url = 'https:' + url;
             if (url.includes('mangahere') || url.includes('store') || url.includes('manga')) {
                 if (!allImages.includes(url)) allImages.push(url);
             }
        }
        return allImages.map((img) => ({ img }));
    } catch (e) {
        return [];
    }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const id = searchParams.get('id');
  const providerName = searchParams.get('provider') || 'mangapill';
  const provider = providers[providerName as keyof typeof providers] || providers.mangapill;

  try {
    // 1. INFO
    if (type === 'info' && id) {
      const info = await provider.fetchMangaInfo(id);
      return NextResponse.json(info);
    }

    // 2. CHAPTERS (With Scraper Fallback)
    if (type === 'chapter' && id) {
      try {
        const pages = await provider.fetchChapterPages(id);
        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
          const webtoonPages = await fetchMangaHereWebtoonsImages(id);
          return NextResponse.json(webtoonPages);
        }
        return NextResponse.json(pages || []);
      } catch (e) {
        if (providerName === 'mangahere') {
          const webtoonPages = await fetchMangaHereWebtoonsImages(id);
          return NextResponse.json(webtoonPages);
        }
        return NextResponse.json([]);
      }
    }

    // 3. SEARCH
    if (query) {
      const results = await provider.search(query);
      return NextResponse.json(results);
    }

    // 4. POPULAR (Trending)
    if (type === 'popular') {
        try {
            const popular = await (provider as any).fetchTrending();
            return NextResponse.json(popular);
        } catch {
            const fallback = await provider.search('Leveling');
            return NextResponse.json(fallback);
        }
    }

    // 5. LATEST (Ongoing)
    if (type === 'latest') {
        try {
            // Try fetching latest updates if supported
            const latest = await (provider as any).fetchLatestUpdates();
            return NextResponse.json(latest);
        } catch {
            // Fallback: search for "New" or "Action" if latest updates fails
            const fallback = await provider.search('Isekai');
            return NextResponse.json(fallback);
        }
    }
    
    // Default fallback (Trending)
    const defaultData = await (provider as any).fetchTrending();
    return NextResponse.json(defaultData);

  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
