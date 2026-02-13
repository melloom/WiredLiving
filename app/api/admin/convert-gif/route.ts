import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for GIF conversion

interface ConversionResponse {
  success: boolean;
  mp4Url?: string;
  webmUrl?: string;
  originalUrl?: string;
  markdown?: string;
  fileId?: string;
  compressionRatio?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ConversionResponse>> {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postSlug = formData.get('postSlug') as string;

    if (!file || !file.type.includes('gif')) {
      return NextResponse.json({
        success: false,
        error: 'Please upload a valid GIF file',
      });
    }

    // Create temp directory if it doesn't exist
    const tempDir = '/tmp/wiredliving-gif-conversion';
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const gifFileName = `${uniqueId}.gif`;
    const mp4FileName = `${uniqueId}.mp4`;
    const webmFileName = `${uniqueId}.webm`;
    
    const gifPath = path.join(tempDir, gifFileName);
    const mp4Path = path.join(tempDir, mp4FileName);
    const webmPath = path.join(tempDir, webmFileName);

    try {
      // Save uploaded GIF to temp file
      const gifBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(gifPath, gifBuffer);

      // Convert GIF to MP4 using FFmpeg
      console.log(`Converting GIF to MP4: ${gifFileName}`);
      
      // High-quality MP4 conversion
      const mp4Command = `ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 23 -preset fast "${mp4Path}"`;
      await execAsync(mp4Command);

      // Also create WebM version for better browser support
      const webmCommand = `ffmpeg -i "${gifPath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -preset fast "${webmPath}"`;
      await execAsync(webmCommand);

      // Get file sizes for compression ratio
      const gifStats = await execAsync(`du -b "${gifPath}"`);
      const mp4Stats = await execAsync(`du -b "${mp4Path}"`);
      const gifSize = parseInt(gifStats.stdout.split('\t')[0]);
      const mp4Size = parseInt(mp4Stats.stdout.split('\t')[0]);
      const compressionRatio = ((gifSize - mp4Size) / gifSize) * 100;

      console.log(`GIF size: ${gifSize} bytes, MP4 size: ${mp4Size} bytes, compression: ${compressionRatio.toFixed(1)}%`);

      // Upload files to Supabase
      const bucket = 'blog-videos';
      
      // Upload MP4
      const { data: mp4Data, error: mp4Error } = await supabase.storage
        .from(bucket)
        .upload(`animations/${mp4FileName}`, await readFile(mp4Path), {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (mp4Error) throw mp4Error;

      // Upload WebM
      const { data: webmData, error: webmError } = await supabase.storage
        .from(bucket)
        .upload(`animations/${webmFileName}`, await readFile(webmPath), {
          contentType: 'video/webm',
          upsert: false,
        });

      // Also upload original GIF as backup
      const { data: gifData, error: gifError } = await supabase.storage
        .from('blog-images')
        .upload(`animations/${gifFileName}`, gifBuffer, {
          contentType: 'image/gif',
          upsert: false,
        });

      if (gifError) throw gifError;

      // Get public URLs
      const { data: mp4Url } = supabase.storage
        .from(bucket)
        .getPublicUrl(`animations/${mp4FileName}`);

      const { data: webmUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(`animations/${webmFileName}`);

      const { data: gifUrl } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`animations/${gifFileName}`);

      // Save to database
      const { data: mediaFile, error: dbError } = await supabase
        .from('media_files')
        .insert({
          filename: mp4FileName,
          original_filename: file.name,
          file_path: `animations/${mp4FileName}`,
          file_size: mp4Size,
          mime_type: 'video/mp4',
          post_slug: postSlug,
          media_type: 'animation',
          metadata: {
            original_gif_url: gifUrl.publicUrl,
            webm_url: webmUrl?.publicUrl,
            original_size: gifSize,
            compressed_size: mp4Size,
            compression_ratio: compressionRatio,
            conversion_method: 'gif-to-mp4',
          },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate markdown for video with fallback
      const markdown = `<video 
  autoplay 
  loop 
  muted 
  playsinline
  class="rounded-lg shadow-lg my-4 max-w-full"
>
  <source src="${mp4Url.publicUrl}" type="video/mp4" />
  ${webmUrl?.publicUrl ? `<source src="${webmUrl.publicUrl}" type="video/webm" />` : ''}
  <img src="${gifUrl.publicUrl}" alt="${file.name.replace('.gif', '')}" class="rounded-lg shadow-lg my-4 max-w-full" />
  Your browser does not support the video tag.
</video>`;

      // Cleanup temp files
      await Promise.all([
        unlink(gifPath).catch(() => {}),
        unlink(mp4Path).catch(() => {}),
        unlink(webmPath).catch(() => {}),
      ]);

      return NextResponse.json({
        success: true,
        mp4Url: mp4Url.publicUrl,
        webmUrl: webmUrl?.publicUrl,
        originalUrl: gifUrl.publicUrl,
        markdown,
        fileId: mediaFile.id,
        compressionRatio: parseFloat(compressionRatio.toFixed(1)),
      });

    } catch (conversionError) {
      console.error('GIF conversion error:', conversionError);
      
      // Cleanup temp files on error
      await Promise.all([
        unlink(gifPath).catch(() => {}),
        unlink(mp4Path).catch(() => {}),
        unlink(webmPath).catch(() => {}),
      ]);

      // Fallback: just upload the original GIF
      const { data: gifData, error: gifError } = await supabase.storage
        .from('blog-images')
        .upload(`animations/${gifFileName}`, gifBuffer, {
          contentType: 'image/gif',
          upsert: false,
        });

      if (gifError) throw gifError;

      const { data: gifUrl } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`animations/${gifFileName}`);

      const markdown = `![${file.name.replace('.gif', '')}](${gifUrl.publicUrl})`;

      return NextResponse.json({
        success: true,
        originalUrl: gifUrl.publicUrl,
        markdown,
        error: 'Conversion failed, uploaded as GIF',
      });
    }

  } catch (error) {
    console.error('GIF conversion API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process GIF',
    });
  }
}

// Helper function to read file
async function readFile(filePath: string): Promise<Buffer> {
  const fs = require('fs').promises;
  return fs.readFile(filePath);
}