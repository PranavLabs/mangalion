import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import axios from 'axios';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- WEBTOON-SPECIFIC SCRAPER FOR MANGAHERE ---
async function fetchMangaHereWebtoonsImages(chapterId: string) {
  try {
    const baseUrl = 'https://www.mangahere.cc';

    let targetUrl: string;
    if (chapterId.startsWith('http')) {
      targetUrl = chapterId;
    } else {
      const cleanId = chapterId.replace(/\/+$/, '');
      targetUrl = `${baseUrl}/manga/${cleanId}/1.html`;
    }

    console.log('[MangaHere Webtoon] Fetching:', targetUrl);

    const allImages: string[] = [];
    let pageNum = 1;
    let hasPages = true;

    while (hasPages && pageNum <= 100) {
      const pageUrl = targetUrl.replace('/1.html', `/${pageNum}.html`);
      console.log('[MangaHere Webtoon] Trying page', pageNum, ':', pageUrl);

      try {
        const { data } = await axios.get(pageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.mangahere.cc/',
          },
          timeout: 10000,
        });

        console.log('[MangaHere Webtoon] Page', pageNum, 'HTML length:', data.length);

        // Multiple extraction methods
        let pageImages = 0;

        // Method 1: Extract from src attributes
        const srcRegex = /src=["']([^"']*(?:jpg|png|webp|jpeg)[^"']*)["']/gi;
        let match;
        while ((match = srcRegex.exec(data)) !== null) {
          let url = match[1];
          if (url.includes('mangahere') || url.includes('fmcdn') || url.includes('zjcdn')) {
            if (!url.includes('loading') && !url.includes('nopicture') && !url.includes('logo') && !url.includes('icon')) {
              if (url.startsWith('//')) {
                url = 'https:' + url;
              } else if (!url.startsWith('http')) {
                url = 'https://' + url;
              }
              if (!allImages.includes(url)) {
                allImages.push(url);
                pageImages++;
              }
            }
          }
        }

        // Method 2: Extract from data-src
        const dataSrcRegex = /data-src=["']([^"']+)["']/gi;
        while ((match = dataSrcRegex.exec(data)) !== null) {
          let url = match[1];
          if ((url.includes('jpg') || url.includes('png') || url.includes('webp')) && !url.includes('loading')) {
            if (url.startsWith('//')) {
              url = 'https:' + url;
            } else if (!url.startsWith('http')) {
              url = 'https://' + url;
            }
            if (!allImages.includes(url)) {
              allImages.push(url);
              pageImages++;
            }
          }
        }

        console.log('[MangaHere Webtoon] Page', pageNum, 'found', pageImages, 'images');

        if (pageImages === 0 && pageNum > 1) {
          hasPages = false;
        }

        pageNum++;
      } catch (e: any) {
        if (e.response?.status === 404) {
          console.log('[MangaHere Webtoon] Page', pageNum, '404 - stopping');
          hasPages = false;
        } else {
          console.log('[MangaHere Webtoon] Page', pageNum, 'error:', e.message);
          hasPages = false;
        }
      }
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
      try {
        const results = await provider.search(query);
        return NextResponse.json(results);
      } catch (e) {
        return NextResponse.json([]);
      }
    }

    try {
      const popular = await (provider as any).fetchTrending();
      return NextResponse.json(popular);
    } catch (e) {
      try {
        const fallback = await provider.search('Isekai');
        return NextResponse.json(fallback);
      } catch {
        return NextResponse.json([]);
      }
    }
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Fetch failed' },
      { status: 500 }
    );
  }
}

