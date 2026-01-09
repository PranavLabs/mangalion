import { NextResponse } from 'next/server';
import { MANGA } from '@consumet/extensions';
import puppeteerCore from 'puppeteer-core';
import axios from 'axios';

// Initialize 2 Providers
const providers = {
  mangapill: new MANGA.MangaPill(),
  mangahere: new MANGA.MangaHere(),
};

// --- MANGAHERE SCRAPER WITH PUPPETEER ---
async function fetchMangaHereImagesWithBrowser(chapterId: string) {
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

    console.log('[MangaHere] Browser: Fetching with Puppeteer:', targetUrl);

    // Use Chromium from Vercel or local puppeteer
    const executablePath = process.env.CHROMIUM_PATH || undefined;
    
    browser = await puppeteerCore.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    
    // Set timeout
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000,
    });

    // Wait for images to load
    await page.waitForSelector('img[src*="jpg"],img[src*="png"],img[src*="webp"]', {
      timeout: 10000,
    }).catch(() => {
      console.log('[MangaHere] Image selector timeout (images may still be there)');
    });

    // Extract all image URLs from the page
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const urls: string[] = [];
      
      imgs.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-original');
        if (src && (src.includes('jpg') || src.includes('png') || src.includes('webp') || src.includes('jpeg'))) {
          // Filter out UI images
          if (!src.includes('logo') && !src.includes('icon') && !src.includes('loading') && !src.includes('static.mangahere') && !src.includes('nopicture')) {
            if (src.startsWith('http')) {
              urls.push(src);
            } else if (src.startsWith('//')) {
              urls.push('https:' + src);
            }
          }
        }
      });
      
      return urls;
    });

    await browser.close();

    if (images.length > 0) {
      console.log('[MangaHere] Browser: Found', images.length, 'images');
      return images.map((img) => ({ img }));
    }

    console.log('[MangaHere] Browser: No images found');
    return [];
  } catch (e: any) {
    console.error('[MangaHere] Browser Error:', e.message);
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

        if ((!pages || pages.length === 0) && providerName === 'mangahere') {
          console.log('[API] Consumet empty, using Puppeteer for:', id);
          const manualPages = await fetchMangaHereImagesWithBrowser(id);
          return NextResponse.json(manualPages);
        }

        return NextResponse.json(pages);
      } catch (e) {
        if (providerName === 'mangahere') {
          console.log('[API] Consumet error, using Puppeteer for:', id);
          const manualPages = await fetchMangaHereImagesWithBrowser(id);
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

