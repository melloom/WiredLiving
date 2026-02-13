import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// YouTube API key (you'll need to add this to your env vars)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Extract YouTube video ID from URL
 */
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

/**
 * Fetch YouTube video metadata
 */
async function fetchYouTubeMetadata(videoId: string) {
  if (!YOUTUBE_API_KEY) {
    // Return empty metadata instead of throwing to prevent errors
    console.warn('YouTube API key not configured');
    return { title: '', artist: '' };
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube metadata');
  }

  const data = await response.json();
  
  if (!data.items?.[0]) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  const title = video.snippet?.title || '';
  
  // Try to extract artist from title (common format: "Artist - Song")
  const parts = title.split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : '';
  const songTitle = parts.length > 1 ? parts[1].trim() : title;

  return { title: songTitle, artist };
}

/**
 * Fetch metadata from direct audio file (basic implementation)
 * Note: For full metadata extraction, you'd need server-side audio processing libraries
 */
async function fetchAudioMetadata(url: string) {
  try {
    // For now, extract from URL path as a fallback
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split('/').pop() || '';
    
    // Remove extension and clean up
    const nameWithoutExt = filename.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '');
    const cleanName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Try to extract artist from filename (common format: "Artist - Song")
    const parts = cleanName.split(' - ');
    const artist = parts.length > 1 ? parts[0].trim() : '';
    const title = parts.length > 1 ? parts[1].trim() : cleanName;
    
    return { title, artist };
  } catch (error) {
    console.error('Error fetching audio metadata:', error);
    return { title: '', artist: '' };
  }
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

    let metadata;

    // Check if it's a YouTube URL
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      metadata = await fetchYouTubeMetadata(youtubeId);
    } else {
      // Handle direct audio file
      metadata = await fetchAudioMetadata(url);
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Error in fetch-audio-metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metadata',
      },
      { status: 500 }
    );
  }
}
