import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  // 1. HTTP to HTTPS Upgrade
  // MangaHere often gives 'http://...' links which browsers block. We fix that here.
  let targetUrl = decodeURIComponent(url);
  if (targetUrl.startsWith('http://')) {
      targetUrl = targetUrl.replace('http://', 'https://');
  }
  // Handle protocol-relative URLs (starts with //)
  if (targetUrl.startsWith('//')) {
      targetUrl = `https:${targetUrl}`;
  }

  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // 2. Source Rules
  if (source === 'mangapill') {
    headers['Referer'] = 'https://mangapill.com/';
  } 
  else if (source === 'mangahere') {
    // MangaHere is strict about this
    headers['Referer'] = 'https://www.mangahere.cc/';
    // Some MangaHere images are on different domains, but this referer usually works
  }

  // Fallback: Guess based on URL
  if (!headers['Referer']) {
      if (targetUrl.includes('mangapill')) headers['Referer'] = 'https://mangapill.com/';
      else if (targetUrl.includes('mangahere') || targetUrl.includes('fmcdn')) headers['Referer'] = 'https://www.mangahere.cc/';
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
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
