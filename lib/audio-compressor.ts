import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

interface CompressionOptions {
  inputBuffer: Buffer;
  bitrate?: '32' | '64' | '96' | '128'; // kbps
  maxDuration?: number; // seconds
}

export async function compressAudio(options: CompressionOptions): Promise<Buffer> {
  const { inputBuffer, bitrate = '64', maxDuration = 240 } = options; // Default 4 minutes
  
  // Create temporary files
  const inputPath = path.join(tmpdir(), `input-${Date.now()}.mp3`);
  const outputPath = path.join(tmpdir(), `output-${Date.now()}.mp3`);
  
  try {
    // Write input buffer to temp file
    fs.writeFileSync(inputPath, inputBuffer);
    
    // Check if ffmpeg is available
    try {
      await execAsync('ffmpeg -version');
    } catch {
      console.log('FFmpeg not available, returning original audio');
      return inputBuffer;
    }
    
    // Build ffmpeg command for compression
    let command = `ffmpeg -i "${inputPath}"`;
    
    // Add bitrate compression
    command += ` -b:a ${bitrate}k`;
    
    // Add duration limit if specified
    if (maxDuration) {
      command += ` -t ${maxDuration}`;
    }
    
    // Add output options
    command += ` -acodec mp3 -ar 22050 -ac 1 "${outputPath}" -y`;
    
    // Execute compression
    await execAsync(command);
    
    // Read compressed file
    const compressedBuffer = fs.readFileSync(outputPath);
    
    // Calculate compression ratio
    const originalSize = inputBuffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Audio compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Compression failed:', error);
    return inputBuffer; // Return original if compression fails
  } finally {
    // Clean up temp files
    try {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch {}
  }
}
