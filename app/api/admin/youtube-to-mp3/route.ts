import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/lib/supabase-storage';
import { compressAudio } from '@/lib/audio-compressor';

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

// Get YouTube video info
async function getYouTubeInfo(videoId: string) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube video info');
  }

  const data = await response.json();
  
  if (!data.items?.[0]) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  const title = video.snippet?.title || 'Unknown';
  const artist = video.snippet?.channelTitle || 'Unknown';
  
  // Extract duration from ISO 8601 format
  const duration = video.contentDetails?.duration || 'PT0S';
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1] || '0');
  const minutes = parseInt(match?.[2] || '0');
  const seconds = parseInt(match?.[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return { title, artist, duration: totalSeconds };
}

// Download and convert YouTube to MP3 using external service
async function downloadYouTubeMP3(videoId: string, title: string): Promise<{ url: string; filename: string }> {
  // Using yt-download.org API with low quality for smaller files
  // Requesting 64kbps to save space (good enough for background music)
  
  try {
    // Try to get low quality version first
    const apiUrl = `https://yt-download.org/api/button/mp3/${videoId}?quality=64`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch download link');
    }

    const data = await response.json();
    
    if (!data.download_link) {
      throw new Error('Download link not available');
    }

    // Download the MP3 file
    const mp3Response = await fetch(data.download_link);
    if (!mp3Response.ok) {
      throw new Error('Failed to download MP3 file');
    }

    let mp3Buffer = Buffer.from(await mp3Response.arrayBuffer());
    
    // Compress the audio to save space
    console.log(`Original audio size: ${(mp3Buffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    try {
      mp3Buffer = await compressAudio({
        inputBuffer: mp3Buffer,
        bitrate: '64', // 64kbps for good quality/size ratio
        maxDuration: 240 // Max 4 minutes to save space
      });
    } catch (error) {
      console.error('Compression failed, using original:', error);
    }
    
    // Create a clean filename
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `audio/${cleanTitle}-${videoId}-${Date.now()}.mp3`;
    
    // Upload to Supabase Storage
    const { url } = await uploadFile(mp3Buffer, filename, {
      contentType: 'audio/mpeg',
      bucket: 'audio' // Dedicated audio bucket
    });
    
    return {
      url,
      filename
    };
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download and store audio');
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

    // Extract YouTube video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info
    const videoInfo = await getYouTubeInfo(videoId);

    // Download the MP3
    const downloadResult = await downloadYouTubeMP3(videoId, videoInfo.title);
    
    return NextResponse.json({
      success: true,
      mp3Url: downloadResult.url,
      filename: downloadResult.filename,
      videoInfo
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
