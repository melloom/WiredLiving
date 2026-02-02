# Media Optimization Scripts

Automated scripts to compress videos and optimize images for your blog.

## 🎬 Video Compression

### Compress Single Video

```bash
# Make script executable (first time only)
chmod +x scripts/compress-video.sh

# Compress with default settings (recommended)
./scripts/compress-video.sh my-video.mp4

# Compress with quality preset
./scripts/compress-video.sh my-video.mp4 high    # Best quality, larger file
./scripts/compress-video.sh my-video.mp4 medium  # Balanced (default)
./scripts/compress-video.sh my-video.mp4 small   # Smaller file, good quality
./scripts/compress-video.sh my-video.mp4 tiny    # Smallest file, lower quality
```

**What it does:**
- Compresses video by 80-90%
- Creates MP4 (H.264) for compatibility
- Creates WebM (VP9) for even better compression
- Maintains great visual quality
- Shows compression stats
- Provides ready-to-use HTML code

**Example output:**
```
Original:   50M
Compressed: 5.2M (MP4)
            3.8M (WebM)
Savings:    89.6%
```

### Compress All Videos in Directory

```bash
# Make script executable (first time only)
chmod +x scripts/compress-all-videos.sh

# Compress all videos in a folder
./scripts/compress-all-videos.sh ./public/videos
./scripts/compress-all-videos.sh ./raw-footage medium
```

## 🖼️ Image Optimization

```bash
# Make script executable (first time only)
chmod +x scripts/optimize-images.sh

# Optimize single image
./scripts/optimize-images.sh photo.jpg

# Optimize with custom quality (1-100)
./scripts/optimize-images.sh photo.png 90
```

**What it does:**
- Converts to WebP (90% smaller than JPG)
- Optimizes original format
- Maintains visual quality

## 📋 Requirements

### Install FFmpeg (Required for video compression)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
- Download from https://ffmpeg.org
- Or use WSL with Ubuntu instructions

### Install WebP tools (Optional, for image optimization)

**Ubuntu/Debian:**
```bash
sudo apt-get install webp
```

**macOS:**
```bash
brew install webp
```

## 🚀 Quick Start Workflow

1. **Record/download your video**
2. **Compress it:**
   ```bash
   ./scripts/compress-video.sh my-video.mp4 medium
   ```
3. **Move to public folder:**
   ```bash
   mv my-video-compressed.mp4 public/videos/
   mv my-video-compressed.webm public/videos/  # if created
   ```
4. **Use in blog post:**
   ```html
   <video controls width="100%" class="rounded-lg my-4">
     <source src="/videos/my-video-compressed.mp4" type="video/mp4" />
     <source src="/videos/my-video-compressed.webm" type="video/webm" />
     Your browser does not support the video tag.
   </video>
   ```

## 💡 Tips

### For Best Results:

1. **Always compress before uploading**
   - Use `medium` quality for most content
   - Use `high` for important videos
   - Use `small` for long videos or multiple videos

2. **File size targets:**
   - Short clip (10-30s): < 5 MB
   - Tutorial (1-2 min): 5-15 MB
   - Long video (3-5 min): 15-30 MB
   - Very long: Use YouTube instead!

3. **Storage savings example:**
   - 10 raw videos: ~500 MB
   - 10 compressed videos: ~50 MB
   - **Savings: 90% = $45/month in hosting costs!**

## 🎯 Quality Presets Explained

| Preset | Resolution | CRF | Best For |
|--------|-----------|-----|----------|
| **high** | 1080p | 20 | Important videos, product demos |
| **medium** | 1080p | 23 | Most blog content (recommended) |
| **small** | 720p | 28 | Long videos, multiple videos |
| **tiny** | 720p | 30 | Very long videos, background loops |

**CRF (Constant Rate Factor):** Lower = better quality, larger file (18-28 recommended)

## 🔧 Troubleshooting

**"ffmpeg: command not found"**
- Install FFmpeg (see Requirements above)

**"Permission denied"**
```bash
chmod +x scripts/*.sh
```

**Video looks bad after compression**
- Use higher quality: `./compress-video.sh video.mp4 high`
- Or increase CRF in script (lower number = better quality)

**File still too large**
- Use `small` or `tiny` preset
- Consider YouTube for videos > 5 minutes
- Reduce resolution to 720p

## 📚 More Info

- [Full Media Guide](../docs/markdown/media-embedding-guide.md)
- [Quick Reference](../docs/markdown/media-quick-reference.md)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
