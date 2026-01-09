import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  const targetUrl = decodeURIComponent(url);

  // Default Referer
  let referer = 'https://google.com';

  // SMART REFERER DETECTION
  if (targetUrl.includes('mangapill')) {
    referer = 'https://mangapill.com/';
  } 
  // FIX: Explicitly use comix.to as requested
  else if (targetUrl.includes('comick') || targetUrl.includes('comix')) {
    referer = 'https://comix.to/'; 
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Some image servers check Origin as well
        'Origin': new URL(referer).origin 
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
    // console.error(`Proxy Fail: ${targetUrl}`); // Uncomment for debugging
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
