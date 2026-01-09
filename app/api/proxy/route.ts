import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const source = request.nextUrl.searchParams.get('source'); 

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  const targetUrl = decodeURIComponent(url);
  
  // Default to a generic referer
  let referer = 'https://google.com';

  // --- STRATEGY 1: TRUST THE 'SOURCE' PARAM (Best) ---
  if (source === 'mangapill') referer = 'https://mangapill.com/';
  else if (source === 'comick') referer = 'https://comix.to/';
  else if (source === 'mangadex') referer = 'https://mangadex.org/';
  else if (source === 'manganato' || source === 'mangakakalot') referer = 'https://chapmanganato.com/';

  // --- STRATEGY 2: GUESS FROM URL (Fallback if Source is missing) ---
  // This saves the Home Page if the source param wasn't passed
  if (referer === 'https://google.com') {
      if (targetUrl.includes('mangapill')) referer = 'https://mangapill.com/';
      else if (targetUrl.includes('comick') || targetUrl.includes('meo') || targetUrl.includes('comix')) referer = 'https://comix.to/';
      else if (targetUrl.includes('mangadex')) referer = 'https://mangadex.org/';
      else if (targetUrl.includes('mkklcdn') || targetUrl.includes('manganato')) referer = 'https://chapmanganato.com/';
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
