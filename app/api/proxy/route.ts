import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  // SMART REFERER DETECTION
  // We determine the correct 'Referer' header based on the image domain.
  let referer = 'https://google.com'; // Default safe referer
  
  if (url.includes('mangapill')) referer = 'https://mangapill.com/';
  else if (url.includes('mangakakalot')) referer = 'https://mangakakalot.com/';
  else if (url.includes('manganato')) referer = 'https://manganato.com/';
  else if (url.includes('chapmanganato')) referer = 'https://chapmanganato.com/';
  else if (url.includes('mangadex')) referer = 'https://mangadex.org/';

  // ComicK usually works without a specific referer, or allows generic ones.

  try {
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    console.error("Proxy Error for:", url);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
