import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  const targetUrl = decodeURIComponent(url);

  // Default Headers
  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // --- SPECIFIC FIX FOR MANGAHERE ---
  if (source === 'mangahere' || targetUrl.includes('mangahere')) {
    // 1. The Referer must look "real"
    headers['Referer'] = 'https://www.mangahere.cc/';
    // 2. The Origin header is often required by their CDN for chapter-only pages
    headers['Origin'] = 'https://www.mangahere.cc';
    // 3. The Cookie is critical for bypassing some age-gates/checks
    headers['Cookie'] = 'isAdult=1; text_size=0;';
  }
  
  // Other Providers
  else if (source === 'mangapill') {
    headers['Referer'] = 'https://mangapill.com/';
  } 
  else if (source === 'asurascans' || targetUrl.includes('asura')) {
    headers['Referer'] = 'https://asuracomic.net/'; 
  }

  // Fallback
  if (!headers['Referer']) {
     if (targetUrl.includes('mangahere')) {
         headers['Referer'] = 'https://www.mangahere.cc/';
         headers['Origin'] = 'https://www.mangahere.cc';
     }
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
      // Increased timeout for slow MangaHere CDNs
      timeout: 15000, 
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // console.error('Proxy Error:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
