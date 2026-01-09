import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  const targetUrl = decodeURIComponent(url);

  // Default Headers (Mimic a real PC browser)
  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // --- SOURCE-SPECIFIC RULES ---

  if (source === 'mangapill') {
    headers['Referer'] = 'https://mangapill.com/';
  } 
  else if (source === 'mangahere') {
    headers['Referer'] = 'https://www.mangahere.cc/';
  }
  else if (source === 'asurascans') {
    // AsuraScans is strict. We use their main domain.
    headers['Referer'] = 'https://asuracomic.net/'; 
  }

  // Fallback: If source is missing, guess based on URL patterns
  if (!headers['Referer']) {
      if (targetUrl.includes('mangapill')) headers['Referer'] = 'https://mangapill.com/';
      else if (targetUrl.includes('mangahere')) headers['Referer'] = 'https://www.mangahere.cc/';
      else if (targetUrl.includes('asura')) headers['Referer'] = 'https://asuracomic.net/';
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
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
