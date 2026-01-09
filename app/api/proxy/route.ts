import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  // CRITICAL FIX: Upgrade insecure HTTP links to HTTPS
  // MangaHere often uses 'http' for webtoon images, which browsers block.
  let targetUrl = decodeURIComponent(url);
  if (targetUrl.startsWith('http://')) {
    targetUrl = targetUrl.replace('http://', 'https://');
  }

  // Headers Setup
  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // Source-Specific Rules
  if (source === 'mangapill') {
    headers['Referer'] = 'https://mangapill.com/';
  } 
  else if (source === 'mangahere') {
    headers['Referer'] = 'https://www.mangahere.cc/';
    // Some MangaHere servers require cookies or stricter headers, but Referer is usually key
  }

  // Fallback Guessing
  if (!headers['Referer']) {
      if (targetUrl.includes('mangapill')) headers['Referer'] = 'https://mangapill.com/';
      else if (targetUrl.includes('mangahere')) headers['Referer'] = 'https://www.mangahere.cc/';
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
      // Disable SSL verification strictly for these old image servers if needed
      // httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) 
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
    // console.error("Proxy Failed:", targetUrl);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
