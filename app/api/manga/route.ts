import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import chromium from '@sparticuz/chromium';
import playwright from 'playwright-core';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- BROWSER-BASED WEBTOON SCRAPER ---
async function fetchMangaHereWebtoonsImagesWithBrowser(chapterId: string) {
  let browser;
  try {
    const baseUrl = 'https://www.mangahere.cc';

    let targetUrl: string;
    if (chapterId.startsWith('http')) {
      targetUrl = chapterId;
    } else {
      const cleanId = chapterId.replace(/\/+$/, '');
      targetUrl = `${baseUrl}/manga/${cleanId}/1.html`;
    }

    console.log('[MangaHere Browser] Fetching:', targetUrl);

    // Launch Chromium with sparticuz for Vercel compatibility
    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    // Go to first page
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for images to load
    await page.waitForTimeout(2000); // Wait for JS to execute

    // Extract all image src attributes
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const urls: string[] = [];

      imgs.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && (src.includes('.jpg') || src.includes('.png') || src.includes('.webp'))) {
          if (!src.includes('loading') && !src.includes('nopicture') && !src.includes('logo')) {
            const fullUrl = src.startsWith('http') ? src : src.startsWith('//') ? 'https:' + src : 'https://' + src;
            if (!urls.includes(fullUrl)) {
              urls.push(fullUrl);
            }
          }
        }
      });

      return urls;
    });

    await context.close();
    await browser.close();

    console.log('[MangaHere Browser] Found', images.length, 'images');
    return images.map((img) => ({ img }));
  } catch (e: any) {
    console.error('[MangaHere Browser] Error:', e.message);
    if (browser) {
      await browser.close().catch(() => {});
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
        const pages = await provider.fetchChapterPages(id);

        // If Consumet works, use it
        if (pages && pages.length > 0) {
          return NextResponse.json(pages);
        }

        // If Consumet fails for Mangahere, use browser scraper
        if (providerName === 'mangahere') {
          console.log('[API] Consumet failed, using browser for webtoons');
          const browserPages = await fetchMangaHereWebtoonsImagesWithBrowser(id);
          return NextResponse.json(browserPages);
        }

        return NextResponse.json([]);
      } catch (e: any) {
        console.error('[API] Error:', e.message);

        // Fallback to browser scraper for Mangahere
        if (providerName === 'mangahere') {
          const browserPages = await fetchMangaHereWebtoonsImagesWithBrowser(id);
          return NextResponse.json(browserPages);
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

