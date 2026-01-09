import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  // 1. DECODE THE URL
  // Sometimes the URL comes in encoded, we need the raw link
  const targetUrl = decodeURIComponent(url);

  // 2. SMART REFERER SELECTION
  // We check keywords in the URL to decide which "ID Badge" to show the server
  let referer = 'https://google.com'; // Default

  if (targetUrl.includes('mangapill')) {
    referer = 'https://mangapill.com/';
  } 
  else if (targetUrl.includes('comick') || targetUrl.includes('comix')) {
    referer = 'https://comick.io/'; // The new ComicK domain
  } 
  else if (targetUrl.includes('mangadex')) {
    referer = 'https://mangadex.org/';
  } 
  else if (targetUrl.includes('manganato') || targetUrl.includes('chapmanganato')) {
    referer = 'https://chapmanganato.com/';
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'Referer': referer,
        // Using a real browser User-Agent is critical for ComicK/MangaPill
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': new URL(referer).origin // Some sites check Origin too
      },
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
    console.error(`Proxy Fail for ${targetUrl}`);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
