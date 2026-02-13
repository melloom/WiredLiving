import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'audio');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s-]/g, '').trim();
    const sanitizedTitle = videoTitle.replace(/\s+/g, '-');

    // Choose audio format (highest quality audio only)
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    
    if (!format) {
      return NextResponse.json({ error: 'No audio format available for this video' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${sanitizedTitle}-${timestamp}.mp3`;
    const filepath = join(UPLOAD_DIR, filename);

    // Download and convert to MP3
    const stream = ytdl(url, { format });
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    await writeFile(filepath, buffer);

    // Create public URL for the audio file
    const publicUrl = `/uploads/audio/${filename}`;

    // Generate markdown for the music player
    const markdown = `<music src="${publicUrl}" />`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      markdown,
      title: videoTitle,
      artist: info.videoDetails.author.name,
      duration: parseInt(info.videoDetails.lengthSeconds),
    });

  } catch (error: any) {
    console.error('YouTube conversion error:', error);
    
    // Handle specific YouTube errors
    if (error.message.includes('Video unavailable')) {
      return NextResponse.json({ error: 'This video is unavailable or private' }, { status: 400 });
    }
    if (error.message.includes('Too many requests')) {
      return NextResponse.json({ error: 'Too many requests. Please try again later' }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to convert YouTube video. Please try again.' 
    }, { status: 500 });
  }
}