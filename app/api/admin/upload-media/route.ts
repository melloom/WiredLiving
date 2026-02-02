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
export const maxDuration = 300; // 5 minutes for video processing

interface UploadResponse {
  success: boolean;
  url?: string;
  originalUrl?: string;
  compressedUrl?: string;
  webmUrl?: string;
  markdown?: string;
  fileId?: string;
  compressionRatio?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quality = (formData.get('quality') as string) || 'medium';
    const postSlug = formData.get('postSlug') as string;
    const autoCompress = formData.get('autoCompress') !== 'false';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      return NextResponse.json(
        { success: false, error: 'Only video and image files are supported' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileNameWithoutExt = path.basename(file.name, fileExt);
    const uniqueId = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    const uniqueFileName = `${fileNameWithoutExt}-${timestamp}-${uniqueId}${fileExt}`;
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, uniqueFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);

    const originalSize = buffer.length;
    const bucket = isVideo ? 'blog-videos' : 'blog-images';

    try {
      // If it's a video and autoCompress is true, compress it
      if (isVideo && autoCompress) {
        console.log(`🎬 Compressing video: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
        
        const compressedFileName = `${fileNameWithoutExt}-${timestamp}-${uniqueId}-compressed.mp4`;
        const webmFileName = `${fileNameWithoutExt}-${timestamp}-${uniqueId}-compressed.webm`;
        const compressedPath = path.join(tempDir, compressedFileName);
        const webmPath = path.join(tempDir, webmFileName);

        // Quality presets
        const qualityPresets: Record<string, { crf: number; scale: string; bitrate: string; audioBitrate: string }> = {
          high: { crf: 20, scale: '1920:-2', bitrate: '5M', audioBitrate: '192k' },
          medium: { crf: 23, scale: '1920:-2', bitrate: '3M', audioBitrate: '128k' },
          small: { crf: 28, scale: '1280:-2', bitrate: '1.5M', audioBitrate: '96k' },
          tiny: { crf: 30, scale: '1280:-2', bitrate: '1M', audioBitrate: '96k' },
        };

        const preset = qualityPresets[quality] || qualityPresets.medium;

        // Compress to MP4
        const mp4Command = `ffmpeg -i "${tempFilePath}" -c:v libx264 -crf ${preset.crf} -preset medium -vf "scale=${preset.scale}" -c:a aac -b:a ${preset.audioBitrate} -movflags +faststart -y "${compressedPath}"`;
        
        console.log('🔄 Compressing to MP4...');
        await execAsync(mp4Command);

        // Compress to WebM (optional, better compression)
        let webmCreated = false;
        try {
          console.log('🔄 Compressing to WebM...');
          const webmCommand = `ffmpeg -i "${tempFilePath}" -c:v libvpx-vp9 -crf ${preset.crf} -b:v 0 -vf "scale=${preset.scale}" -c:a libopus -b:a 96k -y "${webmPath}"`;
          await execAsync(webmCommand);
          webmCreated = true;
        } catch (webmError) {
          console.log('⚠️  WebM encoding skipped (codec not available)');
        }

        // Get compressed file sizes
        const { size: compressedSize } = await import('fs').then(fs => fs.promises.stat(compressedPath));
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        console.log(`✅ Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% savings)`);

        // Upload compressed MP4 to Supabase
        const compressedBuffer = await import('fs').then(fs => fs.promises.readFile(compressedPath));
        const { data: mp4Data, error: mp4Error } = await supabase.storage
          .from(bucket)
          .upload(`videos/${compressedFileName}`, compressedBuffer, {
            contentType: 'video/mp4',
            upsert: false,
          });

        if (mp4Error) throw mp4Error;

        // Upload WebM if created
        let webmData = null;
        if (webmCreated) {
          const webmBuffer = await import('fs').then(fs => fs.promises.readFile(webmPath));
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(`videos/${webmFileName}`, webmBuffer, {
              contentType: 'video/webm',
              upsert: false,
            });
          if (!error) webmData = data;
        }

        // Get public URLs
        const { data: { publicUrl: mp4Url } } = supabase.storage
          .from(bucket)
          .getPublicUrl(`videos/${compressedFileName}`);

        let webmUrl = '';
        if (webmData) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(`videos/${webmFileName}`);
          webmUrl = publicUrl;
        }

        // Save metadata to database
        const { data: mediaFile, error: dbError } = await supabase
          .from('media_files')
          .insert({
            filename: compressedFileName,
            original_filename: file.name,
            file_path: `videos/${compressedFileName}`,
            bucket: bucket,
            mime_type: 'video/mp4',
            file_size: compressedSize,
            original_size: originalSize,
            compression_ratio: parseFloat(compressionRatio),
            uploaded_by: user.id,
            post_slug: postSlug,
            is_compressed: true,
            compression_status: 'completed',
            metadata: {
              quality_preset: quality,
              webm_available: webmCreated,
              webm_path: webmData?.path,
            },
          })
          .select()
          .single();

        if (dbError) console.error('Database error:', dbError);

        // Clean up temp files
        await unlink(tempFilePath).catch(() => {});
        await unlink(compressedPath).catch(() => {});
        if (webmCreated) await unlink(webmPath).catch(() => {});

        // Generate markdown
        const markdown = webmUrl 
          ? `<video controls width="100%" class="rounded-lg my-4">\n  <source src="${mp4Url}" type="video/mp4" />\n  <source src="${webmUrl}" type="video/webm" />\n  Your browser does not support the video tag.\n</video>`
          : `<video controls width="100%" class="rounded-lg my-4">\n  <source src="${mp4Url}" type="video/mp4" />\n  Your browser does not support the video tag.\n</video>`;

        return NextResponse.json({
          success: true,
          url: mp4Url,
          compressedUrl: mp4Url,
          webmUrl: webmUrl || undefined,
          markdown,
          fileId: mediaFile?.id,
          compressionRatio: parseFloat(compressionRatio),
        });

      } else {
        // Direct upload (images, GIFs, or uncompressed videos)
        const uploadPath = isVideo ? `videos/${uniqueFileName}` : `images/${uniqueFileName}`;
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(uploadPath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadPath);

        // Save metadata
        await supabase
          .from('media_files')
          .insert({
            filename: uniqueFileName,
            original_filename: file.name,
            file_path: uploadPath,
            bucket: bucket,
            mime_type: file.type,
            file_size: originalSize,
            uploaded_by: user.id,
            post_slug: postSlug,
            is_compressed: false,
            compression_status: 'completed',
          });

        // Clean up temp file
        await unlink(tempFilePath).catch(() => {});

        // Generate markdown
        const markdown = isVideo
          ? `<video controls width="100%" class="rounded-lg my-4">\n  <source src="${publicUrl}" type="${file.type}" />\n  Your browser does not support the video tag.\n</video>`
          : `![${file.name}](${publicUrl})`;

        return NextResponse.json({
          success: true,
          url: publicUrl,
          markdown,
        });
      }
    } catch (processingError: any) {
      // Clean up temp file on error
      await unlink(tempFilePath).catch(() => {});
      
      console.error('Processing error:', processingError);
      return NextResponse.json(
        { success: false, error: `Processing failed: ${processingError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
