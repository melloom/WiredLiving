# Quick Setup Guide - Video Compression

## ✅ Ready to Compress Your Videos!

I've created automated scripts that will compress your videos and save 80-90% storage space.

## 🚀 Quick Start (3 steps)

### Step 1: Install FFmpeg (one-time setup)

Run this in your terminal:

```bash
sudo apt-get update && sudo apt-get install -y ffmpeg
```

Or if you're on Mac:
```bash
brew install ffmpeg
```

### Step 2: Test the script

```bash
# Navigate to your project
cd /workspaces/WiredLiving

# Test with a video file (replace with your actual video)
./scripts/compress-video.sh path/to/your-video.mp4
```

### Step 3: Use compressed videos in blog

The script will create:
- `your-video-compressed.mp4` (80-90% smaller!)
- `your-video-compressed.webm` (even smaller, optional)

Copy the HTML code the script provides and paste into your blog post!

## 📝 Example Usage

### Compress One Video
```bash
# Default quality (recommended)
./scripts/compress-video.sh my-recording.mp4

# High quality (larger file, better quality)
./scripts/compress-video.sh important-demo.mp4 high

# Small file (smaller, still good quality)
./scripts/compress-video.sh long-tutorial.mov small
```

### Compress All Videos in Folder
```bash
# Compress everything in public/videos
./scripts/compress-all-videos.sh public/videos

# Compress with specific quality
./scripts/compress-all-videos.sh raw-footage small
```

## 🎯 What You'll See

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   WiredLiving Video Compressor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input file: my-video.mp4
Original size: 50M
Quality preset: medium

→ Using MEDIUM quality (1080p, CRF 23) [Recommended]

Compressing to MP4...
✓ MP4 created: my-video-compressed.mp4 (5.2M)

Compressing to WebM...
✓ WebM created: my-video-compressed.webm (3.8M)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Compression complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original:   50M
Compressed: 5.2M (MP4)
            3.8M (WebM)
Savings:    89.6%

Usage in blog post:

<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/my-video-compressed.mp4" type="video/mp4" />
  <source src="/videos/my-video-compressed.webm" type="video/webm" />
  Your browser does not support the video tag.
</video>
```

## 💡 Pro Tips

1. **Always use `medium` quality** for blog content (best balance)
2. **Move compressed files to `/public/videos/`** before using in posts
3. **Delete original large files** after confirming compression worked
4. **Use YouTube for videos > 5 minutes** (saves even more storage)

## 🎬 Real Example

```bash
# 1. Record your tutorial
# 2. Compress it
./scripts/compress-video.sh screen-recording.mp4 medium

# 3. Move to public folder
mv screen-recording-compressed.mp4 public/videos/tutorial.mp4
mv screen-recording-compressed.webm public/videos/tutorial.webm

# 4. Delete original (if compression looks good)
rm screen-recording.mp4

# 5. Use in blog post (from admin editor)
# Click the Video button, paste:
# /videos/tutorial.mp4
```

## 📊 Quality Presets

| Preset | When to Use | File Size | Quality |
|--------|-------------|-----------|---------|
| `high` | Important demos, product showcases | ~10% of original | Excellent |
| `medium` | Most blog content **(recommended)** | ~5-10% of original | Great |
| `small` | Long videos, multiple videos per post | ~3-5% of original | Good |
| `tiny` | Background loops, very long videos | ~1-3% of original | Acceptable |

## ✅ Checklist for Each Video

- [ ] Record/download video
- [ ] Run compression script
- [ ] Check compressed video plays correctly
- [ ] Move to `/public/videos/`
- [ ] Add to blog post via toolbar
- [ ] Delete original large file
- [ ] Celebrate saving 90% storage! 🎉

## 🆘 Need Help?

**Script not working?**
- Make sure FFmpeg is installed: `ffmpeg -version`
- Make scripts executable: `chmod +x scripts/*.sh`

**Video looks bad?**
- Use higher quality: `./scripts/compress-video.sh video.mp4 high`

**File still too large?**
- Use `small` or `tiny` preset
- Or host on YouTube instead

---

**You're all set!** Your scripts are ready to use. Just install FFmpeg and start compressing! 🚀
