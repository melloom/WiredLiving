# WiredLiving Blog - Cache & Slug Management Guide

## 🔄 Cache System

### How It Works

WiredLiving uses Next.js's caching system to serve blog pages quickly. When you update a post, the cache is **automatically revalidated** (cleared) so visitors see the latest content.

### Automatic Cache Clearing

Cache is **automatically cleared** when you:
- ✅ Create a new post
- ✅ Update an existing post
- ✅ Delete a post

The system clears cache for:
- The specific post page (`/blog/your-post-slug`)
- Blog listing page (`/blog`)
- Homepage (`/`)
- Category pages (`/blog/category/your-category`)
- Tag pages (`/blog/tag/your-tag`)

### Manual Cache Clearing

If a post isn't showing updated content, you can manually clear the cache:

1. Go to **Admin Dashboard** (`/admin`)
2. Click the **"Clear Cache"** button in the top-right corner
3. Wait for confirmation toast
4. Refresh your blog page

**When to use manual cache clearing:**
- Post updates aren't appearing on the blog
- Old slug still showing after slug change
- Images or content appearing outdated

---

## 🔒 Lock Slug Feature

### What It Does

The **"Lock Slug"** checkbox prevents the post slug (URL) from automatically changing when you edit the post title.

### How Slugs Work

**Without Lock Slug:**
- Title: "My First Post" → Slug: `my-first-post`
- Update title to: "My Updated Post" → Slug auto-updates to: `my-updated-post`
- ⚠️ Old URL `/blog/my-first-post` becomes a 404

**With Lock Slug:**
- Title: "My First Post" → Slug: `my-first-post`
- Lock slug ✅
- Update title to: "My Updated Post" → Slug stays: `my-first-post`
- ✅ URL remains the same, no broken links!

### When to Use Lock Slug

**✅ Use Lock Slug when:**
- Post is already published and has external links pointing to it
- You want to update the title without breaking SEO/links
- Post has been shared on social media
- You've created bookmarks or references to this URL

**❌ Don't use Lock Slug when:**
- Creating a new draft (not needed yet)
- Title has typos that affected the slug
- You want the slug to match the new title
- Post isn't published yet

### How to Use Lock Slug

1. Edit your post in the admin dashboard
2. Find the **"Lock Slug"** checkbox (below the title field)
3. Check the box to lock the slug
4. Update your title
5. Save the post
6. The slug will remain unchanged!

### Unlocking a Slug

To allow the slug to auto-update again:

1. Edit the post
2. Uncheck the **"Lock Slug"** checkbox
3. Update the title
4. Save
5. The slug will now auto-generate from the new title

---

## 🚨 Troubleshooting

### Post showing old content after update

**Problem:** You updated a post but visitors see the old version.

**Solution:**
1. Click **"Clear Cache"** button in admin dashboard
2. Wait for success message
3. Open the post in a new incognito window to verify
4. If still showing old content, wait 1-2 minutes for CDN to update

### Slug changed and old URL is 404

**Problem:** You updated a title and the slug auto-changed, now old links are broken.

**Solution (Prevention):**
1. Always check **"Lock Slug"** before updating published post titles
2. If already broken, you can't undo it - create a redirect or publish the post again with the old slug

**Solution (Recovery):**
1. Note the old slug from your analytics or external links
2. Edit the post
3. Manually set the slug back to the old value in the slug field
4. Check **"Lock Slug"**
5. Save the post

### Cache cleared but still showing old content

**Possible causes:**
1. **Browser cache:** Clear your browser cache or use incognito mode
2. **CDN cache:** Wait 1-2 minutes for Vercel/CDN cache to update
3. **Service Worker:** If you have a PWA, the service worker may be caching - clear it in DevTools
4. **DNS cache:** On rare occasions, DNS changes take time to propagate

**Advanced solution:**
```bash
# Hard refresh (keyboard shortcuts)
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R

# Or clear site data in Chrome DevTools
1. Open DevTools (F12)
2. Application tab → Clear storage → Clear site data
```

---

## 📊 Cache Status Indicators

When cache is successfully revalidated, you'll see console logs:

```
✅ Cache revalidated for post: old-slug → new-slug
✅ Full blog cache revalidation complete
```

Check your browser console (F12 → Console tab) for these messages.

---

## 🔧 For Developers

### Adding Cache Revalidation to New Features

If you create new API endpoints that modify posts, add cache revalidation:

```typescript
import { revalidatePath } from 'next/cache';

// After successful update
revalidatePath('/blog');
revalidatePath('/blog/[slug]');
revalidatePath('/');
```

### Manual API Call

You can manually trigger cache revalidation via API:

```bash
# Revalidate specific path
curl -X POST https://wiredliving.blog/api/admin/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "/blog/my-post-slug"}'

# Revalidate all blog pages
curl -X POST https://wiredliving.blog/api/admin/revalidate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Note:** You must be authenticated (logged in) for this to work.

---

## 📖 Related Documentation

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [revalidatePath API Reference](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- SEO Guide: `/docs/SEO_GUIDE.md`
- Admin Guide: `/docs/guides/ADMIN_GUIDE.md`

---

**Last Updated:** January 2026
