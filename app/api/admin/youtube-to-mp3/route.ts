import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// YouTube video ID extraction
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract YouTube video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video metadata via noembed (no API key needed, no bot detection)
    const metaResponse = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );

    let title = 'YouTube Video';
    let artist = 'Unknown';

    if (metaResponse.ok) {
      const meta = await metaResponse.json();
      title = meta.title || title;
      artist = meta.author_name || artist;
    }

    // Return metadata — the sticky player handles YouTube URLs via iframe embed
    return NextResponse.json({
      success: true,
      videoInfo: { title, artist, videoId },
    });

  } catch (error) {
    console.error('Error in youtube-to-mp3:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process YouTube URL',
      },
      { status: 500 }
    );
  }
}
