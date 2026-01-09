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
    // 1. Construct the URL (MangaHere IDs usually look like: manga_title/c001)
    // We need to ensure we have the full URL. 
    // Usually the ID passed here is just the relative path part.
    const baseUrl = 'https://www.mangahere.cc';
    // If chapterId is a full URL, use it. Otherwise, construct it.
    // MangaHere IDs in Consumet often come as "manga-name/c001"
    const targetUrl = chapterId.startsWith('http') 
        ? chapterId 
        : `${baseUrl}/${chapterId}.html`; // Try adding .html

    const { data } = await axios.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.mangahere.cc/'
        }
    });

    // 2. EXTRACT IMAGES
    // MangaHere often stores images in a JS variable: var image = ['http...', 'http...'];
    // We use Regex to find this array.
    const imageRegex = /var\s+image\s*=\s*(\[[^\]]+\])/;
    const match = data.match(imageRegex);

    if (match && match[1]) {
        // Parse the pseudo-JSON array
        // The array often looks like: ["//img1.jpg", "//img2.jpg"]
        const rawImages = eval(match[1]); // Be careful with eval, but for this specific scrape it's effective
        
        // 3. CLEAN UP URLs
        // Convert "//url" to "https://url"
        return rawImages.map((img: string) => ({
            img: img.startsWith('//') ? `https:${img}` : img
        }));
    }
    
    // Fallback: Try identifying 'reader-main-img' for single page mode
    return []; 
  } catch (e) {
    console.error("Manual scrape failed:", e);
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
                  const manualPages = await fetchMangaHereImages(id);
                  return NextResponse.json(manualPages);
              }
          }
          return NextResponse.json(pages);
      } catch (e) {
          // If library CRASHES, try manual fix immediately
           if (providerName === 'mangahere') {
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
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
