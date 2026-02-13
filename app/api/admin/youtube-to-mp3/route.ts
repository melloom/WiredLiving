import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/lib/supabase-storage';
import ytdl from '@distube/ytdl-core';

// Allow up to 60 seconds for audio download + upload (requires Vercel Pro for >10s)
export const maxDuration = 60;

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

// Download audio from YouTube using ytdl-core and upload to Supabase
async function downloadAndStoreAudio(
  url: string,
  videoId: string,
  title: string
): Promise<{ url: string; filename: string }> {
  try {
    // Download audio-only stream using ytdl-core
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'lowestaudio', // Smallest file size for background music
    });

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    const audioBuffer = Buffer.concat(chunks);
    console.log(`Downloaded audio size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Create a clean filename
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${cleanTitle}-${videoId}-${Date.now()}.mp3`;

    // Upload to Supabase Storage
    const { url: publicUrl } = await uploadFile(audioBuffer, filename, {
      contentType: 'audio/mpeg',
      bucket: 'audio',
    });

    return { url: publicUrl, filename };
  } catch (error) {
    console.error('Download/upload error:', error);
    throw new Error(
      `Failed to download and store audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Extract video ID for filename
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Could not extract video ID' },
        { status: 400 }
      );
    }

    // Get video info using ytdl-core
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title || 'Unknown';
    const artist = info.videoDetails.author?.name || 'Unknown';
    const duration = parseInt(info.videoDetails.lengthSeconds) || 0;

    // Download audio and upload to Supabase
    const downloadResult = await downloadAndStoreAudio(url, videoId, title);
    
    return NextResponse.json({
      success: true,
      mp3Url: downloadResult.url,
      filename: downloadResult.filename,
      videoInfo: { title, artist, duration },
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
