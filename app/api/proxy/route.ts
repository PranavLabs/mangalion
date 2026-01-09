import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  const targetUrl = decodeURIComponent(url);

  // Default Headers (Mimic a real browser, but NO Referer by default)
  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // --- STRICT SOURCE-BASED ROUTING ---

  if (source === 'mangapill') {
    headers['Referer'] = 'https://mangapill.com/';
  } 
  else if (source === 'comick') {
    // NO REFERRER STRATEGY
    // We intentionally do NOT set the Referer header for ComicK.
    // This allows the request to bypass domain allowlist checks on their CDN.
  } 
  else if (source === 'mangadex') {
    headers['Referer'] = 'https://mangadex.org/';
  } 
  else if (source === 'manganato' || source === 'mangakakalot') {
    headers['Referer'] = 'https://chapmanganato.com/';
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
    // console.error(`Proxy Error: ${targetUrl}`);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
