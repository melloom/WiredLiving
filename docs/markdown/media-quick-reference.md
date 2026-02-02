# Media Embedding Examples - Quick Reference

This file shows you exactly what to type in the markdown editor for different media types.

---

## 📷 **Regular Image**

**Type this:**
```markdown
![Beautiful sunset](/images/sunset.jpg)
```

**You'll see:**
A nicely formatted image with rounded corners and shadow

---

## 🎬 **Animated GIF**

**Type this:**
```markdown
![Loading animation](/images/loader.gif)
```

**You'll see:**
The GIF plays automatically in the preview (same styling as images)

---

## 📹 **Self-hosted Video (MP4)**

**⚠️ IMPORTANT: Always compress videos first!** Use HandBrake or FFmpeg to reduce file size by 80-90%.

**Click the "Video" button or type this:**
```html
<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/tutorial.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

**You'll see:**
A video player with play/pause controls, seek bar, volume, fullscreen
- Visitors can pause, play, seek, adjust volume
- Just like YouTube but on your own site!

**Quick compression (FFmpeg):**
```bash
# Compress video to web-optimized size (saves 80-90% storage)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -vf scale=1280:-2 output.mp4

# Result: 50 MB → 5 MB, still looks great!
```

**Customize it:**
```html
<!-- With thumbnail poster image -->
<video controls poster="/images/video-thumb.jpg" class="rounded-lg">
  <source src="/videos/demo.mp4" type="video/mp4" />
</video>

<!-- Autoplay + loop + muted (like an animated background) -->
<video autoplay loop muted playsinline class="rounded-lg">
  <source src="/videos/background.mp4" type="video/mp4" />
</video>

<!-- Provide multiple formats for best compatibility -->
<video controls class="rounded-lg">
  <source src="/videos/tutorial.mp4" type="video/mp4" />
  <source src="/videos/tutorial.webm" type="video/webm" />
  Your browser does not support the video tag.
</video>
```

---

## ▶️ **YouTube Video**

**Click the "YouTube" button or type this:**
```html
<div class="video-wrapper my-6">
  <iframe 
    width="100%" 
    height="400" 
    src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen 
    class="rounded-lg">
  </iframe>
</div>
```

**How to get the video ID:**
1. YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
2. Take the part after `v=`: **dQw4w9WgXcQ**
3. Use in embed: `https://www.youtube.com/embed/dQw4w9WgXcQ`

**Add options:**
```html
<!-- Start at 30 seconds and autoplay muted -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID?start=30&autoplay=1&mute=1"></iframe>

<!-- Loop the video -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID?loop=1&playlist=VIDEO_ID"></iframe>
```

---

## 🎬 **Vimeo Video**

**Type this:**
```html
<div class="video-wrapper my-6">
  <iframe 
    src="https://player.vimeo.com/video/123456789" 
    width="100%" 
    height="400" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen
    class="rounded-lg">
  </iframe>
</div>
```

**Find Vimeo video ID:**
- URL: `https://vimeo.com/123456789`
- Video ID: `123456789`
- Embed: `https://player.vimeo.com/video/123456789`

---

## 📊 **Mixed Media Gallery**

**Type this:**
```markdown
Here's a walkthrough of the new feature:

![Screenshot 1](/images/feature-1.jpg)
*First, navigate to the settings page*

![Demo animation](/images/feature-demo.gif)
*Click the button and watch it animate*

<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/full-demo.mp4" type="video/mp4" />
</video>
*Full video tutorial showing all steps*

<div class="video-wrapper my-6">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" width="100%" height="400"></iframe>
</div>
*Deep dive explanation on our YouTube channel*
```

---

## 🎯 **Real-World Example: Tutorial Post**

```markdown
# How to Deploy Your Next.js App to Vercel

Deploying your app is simple! Here's how:

## Step 1: Sign up for Vercel

![Vercel signup page](/images/vercel-signup.jpg)

## Step 2: Connect your repository

![Connecting GitHub](/images/connect-github.gif)
*The connection process is quick and automatic*

## Step 3: Configure build settings

<video controls width="100%" class="rounded-lg my-4">
  <source src="/videos/vercel-config.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
*Watch this quick video showing the configuration*

## Step 4: Deploy!

That's it! For a detailed walkthrough, check out this video:

<div class="video-wrapper my-6">
  <iframe 
    width="100%" 
    height="400" 
    src="https://www.youtube.com/embed/VIDEO_ID" 
    frameborder="0" 
    allowfullscreen 
    class="rounded-lg">
  </iframe>
</div>

---

**Questions?** [Contact me](/contact) or [read the docs](/docs)
```

---

## 🛠️ **Using the Toolbar Buttons**

The markdown editor has **4 media buttons** in the toolbar:

1. **📷 Image button** - Inserts: `![alt text](https://example.com/image.jpg)`
2. **🎬 GIF button** - Inserts: `![animated gif](https://example.com/animation.gif)`
3. **📹 Video button** - Inserts full `<video>` tag with controls
4. **▶️ YouTube button** - Inserts responsive `<iframe>` wrapper

Just click any button and replace the placeholder URL with your actual file!

---

## ✅ **Quick Tips**

- **Images & GIFs**: Use markdown syntax `![alt](url)`
- **Videos**: Use HTML `<video>` tag with `controls` attribute for visitor playback
- **YouTube/Vimeo**: Use `<iframe>` embeds
- **All media**: Automatically responsive and lazy-loaded
- **Live preview**: See your media render in real-time!
- **⚠️ COMPRESS VIDEOS**: Always compress before upload to save 80-90% storage!

### 🎬 Video Compression Quick Guide

**Before uploading ANY video, compress it:**

1. **Using HandBrake (Easy, Free Desktop App):**
   - Download: https://handbrake.fr
   - Open your video → Select "Fast 1080p30" preset
   - Click Start → Done! (File size reduced 80-90%)

2. **Using FFmpeg (Command line, Best results):**
   ```bash
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -vf scale=1280:-2 output.mp4
   ```

3. **Using online tools (Quick):**
   - https://www.freeconvert.com/video-compressor
   - https://www.videosmaller.com

**Results:**
- Original: 50 MB → Compressed: 5 MB
- Still looks great on web!
- Saves storage, bandwidth, and money
- Faster loading for visitors

---

## 🚀 **Next Steps**

1. Try adding an image to your post
2. Insert a GIF animation
3. Embed a YouTube video
4. Upload a video file and use the `<video>` tag

Need more help? Check out the [full media embedding guide](./media-embedding-guide.md)!
