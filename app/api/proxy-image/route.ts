import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // Validate that it's a proper URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(imageUrl);
    } catch {
      return new NextResponse('Invalid image URL', { status: 400 });
    }

    // Optional: Whitelist domains for security

    const allowedDomains = [
      'blueprint.ng',
      'unsplash.com',
      'images.unsplash.com',
      'cdn.pixabay.com',
      'picsum.photos',
      'media.giphy.com',
      'i.giphy.com',
      'giphy.com',
      'media.tenor.com',
      'tenor.com',
      // Add other trusted image sources
    ];

    const isAllowed = allowedDomains.some(domain => 
      targetUrl.hostname === domain || targetUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WiredLiving/1.0)',
      },
    });

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { 
        status: imageResponse.status 
      });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
