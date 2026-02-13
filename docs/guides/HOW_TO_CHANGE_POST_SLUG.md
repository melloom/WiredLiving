# How to Change a Post's Slug (URL)

## Quick Guide

Want to change a post's URL from `/blog/old-slug` to `/blog/new-slug`? Here's how:

### Step-by-Step Instructions

1. **Go to Admin Dashboard**
   - Navigate to `/admin`
   - Click on the **"Posts"** tab
   - Find the post you want to edit
   - Click the **"✏️ Edit"** button

2. **Change the Slug**
   - Look for the **"Custom Slug"** field (below the title)
   - Type your new slug in the input field
   - Example: Change `my-old-post` to `my-new-post`
   - ⚠️ Use only lowercase letters, numbers, and hyphens

3. **Lock the Slug (Important!)**
   - **Check the "Lock" checkbox** next to the slug field
   - This prevents the slug from auto-changing if you later update the title
   - ✅ Always lock the slug for published posts!

4. **Save the Post**
   - Scroll down and click **"Update Post"**
   - Wait for the success message

5. **Automatic Magic Happens**
   - ✅ Post URL is updated to `/blog/new-slug`
   - ✅ Analytics are migrated from old slug to new slug
   - ✅ Cache is cleared for both old and new URLs
   - ✅ Database is updated
   - ⚠️ Old URL `/blog/old-slug` will now show 404 (not found)

---

## Important Notes

### ⚠️ Warning: Changing Slugs Breaks Links

When you change a slug, the **old URL stops working**. This means:
- External links pointing to your post will break
- Social media shares will show 404
- Search engine results will need to be re-indexed
- Bookmarks won't work anymore

### ✅ When to Change a Slug

**Good reasons:**
- Fixing typos in the slug
- Making the slug shorter and more memorable
- Improving SEO with better keywords
- Before publishing a draft (not published yet)

**Bad reasons:**
- Just because you updated the title (use lock slug instead!)
- Post is already popular and widely shared
- You're not sure what the new slug should be

---

## Understanding the Slug Fields

### "Custom Slug" Field
- Type your desired slug here
- If empty, auto-generates from the title
- Shows preview below: `slug-will-be-this`

### "Lock" Checkbox
- ☑️ **Checked** = Slug won't change even if you update the title
- ☐ **Unchecked** = Slug auto-regenerates from title on each save

### How They Work Together

**Scenario 1: New Draft Post**
- Title: "My First Blog Post"
- Custom Slug: (empty)
- Lock: ☐ Unchecked
- **Result:** Slug auto-generates as `my-first-blog-post`

**Scenario 2: Published Post with Title Change**
- Title: "My First Blog Post" → "My Updated Blog Post"
- Custom Slug: (empty)
- Lock: ☐ Unchecked
- **Result:** Slug changes from `my-first-blog-post` to `my-updated-blog-post`
- ⚠️ **Problem:** Old URL is broken!

**Scenario 3: Published Post with Locked Slug**
- Title: "My First Blog Post" → "My Updated Blog Post"
- Custom Slug: (empty or `my-first-blog-post`)
- Lock: ☑️ **Checked**
- **Result:** Slug stays as `my-first-blog-post`
- ✅ **Perfect:** URL doesn't change, no broken links!

**Scenario 4: Manually Changing Slug**
- Title: "My First Blog Post"
- Custom Slug: `awesome-new-url`
- Lock: ☑️ **Checked**
- **Result:** Slug changes to `awesome-new-url`
- ✅ Analytics and cache are automatically migrated

---

## What Happens When You Change a Slug?

### Automatic System Actions

When you save a post with a new slug, the system:

1. **Updates the Database**
   - Changes `slug` field in the posts table
   - Preserves all other post data

2. **Migrates Analytics**
   - Copies page views from old slug to new slug
   - Merges visitor counts
   - Updates last viewed timestamp
   - Deletes old analytics row

3. **Clears Cache**
   - Revalidates `/blog/old-slug` (to show 404)
   - Revalidates `/blog/new-slug` (to show post)
   - Revalidates `/blog` (main listing)
   - Revalidates `/` (homepage)
   - Revalidates category and tag pages

4. **Logs the Change**
   - Records admin action in audit log
   - Includes old and new slug in metadata
   - Tracks who made the change and when

### Console Confirmation

After saving, check your browser console (F12 → Console):

```
✅ Cache revalidated for post: old-slug → new-slug
```

If you see this message, the migration was successful!

---

## Slug Formatting Rules

### ✅ Valid Slugs

```
my-blog-post
how-to-cook-pasta
2024-year-in-review
nextjs-14-tutorial
the-ultimate-guide
```

### ❌ Invalid Slugs

```
My Blog Post         (has spaces)
my_blog_post         (has underscores)
my-blog-post!        (has special characters)
My-Blog-Post         (has uppercase)
```

### Auto-Formatting

The system automatically:
- Converts to lowercase
- Replaces spaces with hyphens
- Removes special characters
- Removes consecutive hyphens

**Example:**
- Input: `My Blog Post!!!`
- Output: `my-blog-post`

---

## Troubleshooting

### Problem: Changed slug but still shows old URL

**Solution:**
1. Click **"Clear Cache"** button in admin header
2. Wait for success message
3. Open post in **incognito window**
4. If still wrong, check slug field - it might not have saved

### Problem: New slug shows 404

**Causes:**
- Cache hasn't cleared yet (wait 30 seconds)
- Browser cache is old (hard refresh: Ctrl+Shift+R)
- Slug field is empty (slug auto-generated from title)

**Solution:**
1. Clear browser cache
2. Clear site cache (admin button)
3. Check database to verify slug was saved

### Problem: Want to undo slug change

**Solution:**
1. Edit the post again
2. Change "Custom Slug" back to the old slug
3. Keep "Lock" checked
4. Save the post
5. Old URL will work again!

### Problem: Old URL should redirect to new URL

**Current Behavior:**
- Old URLs show 404 (not found)
- No automatic redirects

**Future Feature:**
- Redirect support coming soon
- For now, use slug lock to prevent URL changes

---

## Best Practices

### Before Publishing
- ✅ Set your final slug before publishing
- ✅ Check that slug matches your title/content
- ✅ Lock the slug before publishing
- ✅ Keep slugs short and descriptive (3-6 words)

### After Publishing
- ✅ **Always lock the slug** to prevent accidental changes
- ✅ Only change slug if absolutely necessary
- ✅ Notify followers if you change a popular post's URL
- ✅ Update any internal links to the post

### SEO Tips
- ✅ Include primary keyword in slug
- ✅ Keep it under 60 characters
- ✅ Make it descriptive and readable
- ✅ Avoid stop words (the, a, an, and, or, but)

**Good SEO Slugs:**
```
nextjs-14-server-actions-guide
fix-react-hydration-error
best-vs-code-extensions-2024
```

**Bad SEO Slugs:**
```
post-1
my-thoughts
untitled
the-best-guide-for-learning-how-to-use-nextjs
```

---

## Summary Checklist

When changing a post slug, remember to:

- [ ] Edit the post in admin dashboard
- [ ] Type new slug in "Custom Slug" field
- [ ] **Check the "Lock" checkbox**
- [ ] Click "Update Post" to save
- [ ] Verify new URL works: `/blog/new-slug`
- [ ] Clear cache if post doesn't update (use admin button)
- [ ] Update any internal links pointing to the old URL
- [ ] Inform followers if it's a popular post

---

## Related Documentation

- [Cache & Slug Management Guide](./CACHE_AND_SLUG_GUIDE.md)
- [Admin Dashboard Guide](./ADMIN_GUIDE.md)
- [SEO Best Practices](../SEO_GUIDE.md)

---

**Last Updated:** January 2026
