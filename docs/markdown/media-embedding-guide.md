# Media Embedding Guide - GIF, Video, and YouTube

This guide shows you how to embed various types of media in your blog posts using the markdown editor.

## 🖼️ Images

Standard markdown syntax:

```markdown
![Alt text describing the image](/images/my-image.jpg)
```

**Tips:**
- Always include descriptive alt text for accessibility
- Use relative paths for local images: `/images/...`
- Images support alignment with classes: `![img](/path.jpg){.align-right .size-small}`

## 🎬 Animated GIFs

GIFs work exactly like regular images:

```markdown
![Animated demonstration](/images/animation.gif)
```

**Best practices:**
- Keep GIF file size under 5MB for faster loading
- Use GIFs sparingly - they can slow down page load
- Consider using video instead for longer animations

## 📹 HTML5 Video

For self-hosted videos (MP4, WebM, OGG):

```html
<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/demo.mp4" type="video/mp4" />
  <source src="/videos/demo.webm" type="video/webm" />
  Your browser does not support the video tag.
</video>
```

### 🎯 Video Compression & Storage Optimization

**IMPORTANT: Always compress videos before uploading to save storage and bandwidth!**

**Recommended settings for web videos:**
- **Resolution:** 1080p (1920x1080) max, 720p (1280x720) for most content
- **Bitrate:** 2-5 Mbps for 1080p, 1-2.5 Mbps for 720p
- **Frame rate:** 30fps (60fps only for high-motion content)
- **Format:** MP4 (H.264) - best compatibility and compression

**Free compression tools:**
1. **HandBrake** (Desktop - Windows/Mac/Linux)
   - Download: https://handbrake.fr
   - Preset: "Web" > "Gmail Small 5 Minutes 480p30"
   - Or custom: H.264, RF 23-28, 720p/1080p, 30fps

2. **FFmpeg** (Command line - Best quality/size ratio)
   ```bash
   # Compress to web-optimized MP4
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -vf scale=1280:-2 output.mp4
   
   # Even smaller file (lower quality)
   ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 96k -vf scale=1280:-2 output-small.mp4
   
   # Create WebM version (better compression, modern browsers)
   ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm
   ```

3. **Online tools** (Quick & easy)
   - https://www.freeconvert.com/video-compressor
   - https://www.videosmaller.com
   - https://clideo.com/compress-video

**Compression results:**
- Original: 50 MB → Compressed: 5-10 MB (80-90% smaller!)
- Still looks great for web viewing
- Faster loading, less storage cost

### Video Player Options

**Basic controls:**
```html
<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/tutorial.mp4" type="video/mp4" />
</video>
```

**With thumbnail poster:**
```html
<video controls poster="/images/video-thumbnail.jpg" class="rounded-lg">
  <source src="/videos/demo.mp4" type="video/mp4" />
</video>
```

**Autoplay background (muted, looping):**
```html
<video autoplay loop muted playsinline class="rounded-lg">
  <source src="/videos/background.mp4" type="video/mp4" />
</video>
```

**All options:**
- `controls` - Shows play/pause/volume controls (visitors can pause/play)
- `autoplay` - Auto-plays on load (must be muted!)
- `loop` - Loops the video
- `muted` - Starts muted
- `playsinline` - Plays inline on mobile (no fullscreen)
- `poster="/path/to/thumbnail.jpg"` - Thumbnail before play

### ✅ Best Practices

1. **Always compress videos** before uploading
2. **Use `controls`** so visitors can pause/play/seek
3. **Add `poster` image** for better first impression
4. **Provide multiple formats** (MP4 + WebM) for best compatibility
5. **Keep videos under 2 minutes** for web content
6. **Consider YouTube** for longer videos (saves your storage)

## 🎥 YouTube Embeds

For YouTube videos, use iframe embeds:

```html
<div class="video-wrapper my-6">
  <iframe 
    width="100%" 
    height="400" 
    src="https://www.youtube.com/embed/VIDEO_ID" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen 
    class="rounded-lg">
  </iframe>
</div>
```

**Finding the video ID:**
- YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID: `dQw4w9WgXcQ`
- Embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`

**YouTube options (add to embed URL):**
- `?autoplay=1` - Auto-play on load
- `?start=30` - Start at 30 seconds
- `?end=90` - End at 90 seconds
- `?mute=1` - Start muted
- `?loop=1&playlist=VIDEO_ID` - Loop the video

**Example with options:**
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=10&autoplay=1&mute=1"></iframe>
```

## 🎬 Vimeo Embeds

For Vimeo videos:

```html
<div class="video-wrapper my-6">
  <iframe 
    src="https://player.vimeo.com/video/VIDEO_ID" 
    width="100%" 
    height="400" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen
    class="rounded-lg">
  </iframe>
</div>
```

## 📊 Responsive Video Embeds

The editor automatically wraps iframes in a responsive container. The default aspect ratio is 16:9.

For custom aspect ratios, you can adjust the CSS:

```html
<div class="video-wrapper my-6" style="padding-bottom: 56.25%;">
  <!-- 56.25% = 16:9 aspect ratio -->
  <!-- 75% = 4:3 aspect ratio -->
  <!-- 100% = 1:1 square aspect ratio -->
  <iframe src="..." class="absolute top-0 left-0 w-full h-full"></iframe>
</div>
```

## 🎨 Media Gallery

Create a media gallery with multiple items:

```markdown
![Photo 1](/images/gallery/1.jpg)
![Photo 2](/images/gallery/2.jpg)
![Animation](/images/gallery/demo.gif)
```

## ⚡ Performance Tips

### 1. Compress & Optimize Videos

**CRITICAL: Always compress videos before uploading!**

```bash
# Quick compression with FFmpeg (saves 80-90% storage)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -vf scale=1280:-2 output.mp4
```

**Target file sizes:**
- Short clip (10-30 sec): Under 5 MB
- Tutorial (1-2 min): 5-15 MB
- Long video (3-5 min): 15-30 MB
- Anything longer: Use YouTube!

### 2. Use Lazy Loading

All media (images, videos, iframes) automatically lazy-loads:
- Only loads when scrolling into view
- Saves bandwidth and speeds up page load
- Already built-in - no action needed!

### 3. Choose the Right Format

**For static images:**
- JPG - Photos and complex images
- PNG - Graphics, logos, transparency
- WebP - Best compression (90% smaller than JPG)
- SVG - Icons and simple graphics

**For animations:**
- GIF - Simple, short animations (under 3 seconds)
- MP4 Video - Complex or long animations (90% smaller than GIF!)
- WebM - Modern format, even smaller

**For videos:**
- **Self-hosted:** MP4 (H.264) - Best compatibility
- **Also provide:** WebM (better compression, modern browsers)
- **Long videos:** YouTube/Vimeo (saves your storage)

### 4. Video Optimization Tips

✅ **DO:**
- Compress videos to 720p or 1080p max
- Use 30fps (not 60fps unless needed)
- Keep bitrate at 2-5 Mbps
- Add poster images for faster perceived load
- Provide multiple formats (MP4 + WebM)

❌ **DON'T:**
- Upload 4K videos (way too large!)
- Use high frame rates (60fps+) unnecessarily  
- Forget to compress before upload
- Auto-play with sound (annoying!)

### 5. Storage Cost Savings

**Example savings with compression:**
- Original 4K video (500 MB) → Compressed 1080p (25 MB) = **95% savings**
- Original GIF (10 MB) → MP4 video (1 MB) = **90% savings**
- Multiple uncompressed images (50 MB) → WebP (5 MB) = **90% savings**

**With 100 blog posts:**
- Without compression: ~5 GB storage
- With compression: ~500 MB storage
- **Savings: $40-50/month in hosting costs!**

## 🔧 Using the Toolbar

The markdown editor toolbar has buttons for quick insertion:

- **📷 Image** - Inserts standard image markdown
- **🎬 GIF** - Inserts GIF image markdown (same as image)
- **📹 Video** - Inserts HTML5 video tag template
- **▶️ YouTube** - Inserts YouTube iframe embed template

Simply click the button and replace the placeholder URL with your actual media URL!

## 🚨 Common Issues

**Video not playing:**
- Check file format (MP4 is most compatible)
- Ensure `controls` attribute is present
- Check file path is correct

**YouTube embed not showing:**
- Use `/embed/` URL format, not `/watch?v=`
- Check video privacy settings (must be public or unlisted)
- Some videos disable embedding - check video settings

**Large GIF causing slow load:**
- Optimize GIF file size with tools like ezgif.com
- Consider converting to MP4 video (90% smaller!)
- Use loading="lazy" attribute if adding manually

## 💡 Examples

### Simple animated demo:
```markdown
![Demo of feature](/images/demo.gif)
*Figure 1: How the feature works*
```

### Tutorial video:
```html
<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/tutorial.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

*Video tutorial: Getting started in 5 minutes*
```

### YouTube product review:
```html
<div class="video-wrapper my-6">
  <iframe 
    width="100%" 
    height="400" 
    src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
    frameborder="0" 
    allowfullscreen 
    class="rounded-lg">
  </iframe>
</div>

*In-depth product review from our YouTube channel*
```

---

**Need help?** Check the [main markdown guide](./markdown-guide.md) or [contact support](/contact).
