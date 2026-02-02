# Cover Image Crop Feature - Migration Guide

## What was added

This update adds image cropping functionality for featured posts on the home page. When a post is marked as featured and has a cover image, you can now control exactly which part of the image is displayed in the featured post card.

## Changes Made

### 1. Database Schema
- Added `cover_image_crop` column to the `blog_posts` table (JSONB type)
- Migration file: `/migrations/supabase-migration-add-cover-crop.sql`

### 2. Type Definitions
- Updated `BlogPost` interface in `/types/index.ts` to include `coverImageCrop` field

### 3. Components
- Created new `ImageCropModal` component for easy image positioning
- Updated `PostCard` component to use crop settings for featured posts
- Updated `AdminDashboard` (both Create and Edit forms) to include crop button

### 4. API & Validation
- Updated validation schema to accept `coverImageCrop` field
- Updated POST and PUT endpoints to save crop data
- Updated database layer to serialize/deserialize crop settings

## Migration Steps

### Step 1: Run the database migration

If you're using Supabase:

```bash
# Connect to your Supabase instance and run the migration
psql your-database-url < migrations/supabase-migration-add-cover-crop.sql
```

Or via Supabase Dashboard:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/supabase-migration-add-cover-crop.sql`
4. Run the SQL

### Step 2: No code changes needed
All code changes are already included in this update.

## How to Use

### For Content Creators

1. Go to Admin Dashboard
2. Create or edit a post
3. Upload a cover image
4. Check "Mark as featured"
5. Click the **"Crop for Home Page Featured Card"** button
6. Choose a preset position or enter a custom CSS object-position value
7. Preview how it looks in the modal
8. Save

### Preset Positions Available
- Top Left, Top Center, Top Right
- Center Left, Center, Center Right
- Bottom Left, Bottom Center, Bottom Right

### Custom Positions
You can also enter custom CSS values like:
- `50% 30%` (horizontal % vertical %)
- `center top` (keyword values)
- `left 25%` (mixed values)

## How It Works

The crop settings only affect the **featured post card on the home page**. The full image still appears on:
- The blog post detail page
- Other listings
- Social media shares (OG images)

The crop data is stored as JSON in the database:
```json
{
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 100,
  "objectPosition": "50% 30%"
}
```

## Troubleshooting

### Crop button doesn't appear
- Make sure the post is marked as "featured"
- Make sure a cover image is uploaded

### Crop settings not being saved
- Check that the database migration was run successfully
- Verify the `cover_image_crop` column exists in your `blog_posts` table

### Image still looks wrong
- Try different preset positions
- Use the preview in the modal to test before saving
- Remember: the crop only affects the h-40/h-44 featured card on the home page

## Rollback

If you need to rollback this feature:

```sql
-- Remove the column
ALTER TABLE blog_posts DROP COLUMN IF EXISTS cover_image_crop;

-- Remove the index
DROP INDEX IF EXISTS idx_blog_posts_cover_image_crop;
```

Then revert the code changes from this update.
