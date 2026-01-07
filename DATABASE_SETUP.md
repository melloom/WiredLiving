# Database Setup Guide - Vercel

This guide covers setting up **Vercel Postgres** and **Vercel Blob** for your blog.

## 🎯 Vercel Postgres + Blob Storage

**Why Vercel?**
- ✅ Seamless integration with Vercel deployments
- ✅ Serverless Postgres database
- ✅ Blob storage for images and files
- ✅ Edge-ready and fast
- ✅ Automatic scaling
- ✅ Free tier available

**Why Supabase?**
- ✅ PostgreSQL database (powerful & reliable)
- ✅ Built-in file storage (for images, assets)
- ✅ Free tier: 500MB database + 1GB storage
- ✅ Easy to use with Next.js
- ✅ Includes authentication if needed later
- ✅ Real-time capabilities
- ✅ Great documentation

### Setup Steps

1. **Install Dependencies**

```bash
npm install @vercel/postgres @vercel/blob
```

2. **Set Up Vercel Postgres**

   - Go to your Vercel project dashboard
   - Navigate to **Storage** → **Create Database**
   - Select **Postgres**
   - Choose your plan (Hobby tier is free)
   - Vercel will automatically add environment variables to your project

3. **Set Up Vercel Blob Storage**

   - In your Vercel project dashboard
   - Navigate to **Storage** → **Create Database**
   - Select **Blob**
   - Choose your plan
   - Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment

4. **Environment Variables**

   Vercel automatically adds these to your project:
   - `POSTGRES_URL` - Database connection string
   - `POSTGRES_PRISMA_URL` - Prisma connection string (if using Prisma)
   - `POSTGRES_URL_NON_POOLING` - Direct connection string
   - `BLOB_READ_WRITE_TOKEN` - Blob storage token

   For local development, add these to `.env.local`:
   ```env
   POSTGRES_URL=your-postgres-url
   POSTGRES_PRISMA_URL=your-prisma-url
   POSTGRES_URL_NON_POOLING=your-non-pooling-url
   BLOB_READ_WRITE_TOKEN=your-blob-token
   ```

5. **Initialize Database Schema**

   After deploying, visit:
   ```
   https://your-domain.com/api/init-db
   ```

   Or run this SQL directly in Vercel's database dashboard:

```sql
-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  reading_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create post_tags junction table
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_date ON posts(date DESC);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published posts
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (published = true);
```

## 📦 What's Included

### Vercel Postgres
- **Storage**: Varies by plan (Hobby: 256MB, Pro: 8GB+)
- **Type**: PostgreSQL (serverless)
- **Use for**: Blog posts, metadata, tags, relationships
- **Features**: Auto-scaling, connection pooling, edge-ready

### Vercel Blob
- **Storage**: Varies by plan
- **Type**: Object storage
- **Use for**: Images, files, media assets
- **Features**: CDN-backed, fast uploads/downloads

## 🔄 Alternative Options

### PlanetScale
**Best if:** You want MySQL compatibility

```bash
npm install @planetscale/database
```

- MySQL-compatible
- Free tier: 5GB storage
- Great for scaling

### Turso
**Best if:** You want edge-ready, fast reads

```bash
npm install @libsql/client
```

- SQLite-based
- Edge-ready
- Free tier: 9GB storage

### Neon
**Best if:** You want serverless Postgres with branching

```bash
npm install @neondatabase/serverless
```

- Serverless Postgres
- Git-like branching
- Auto-scaling

## 📊 Vercel Storage Plans

| Service | Hobby (Free) | Pro | Enterprise |
|---------|-------------|-----|------------|
| **Postgres** | 256MB | 8GB+ | Custom |
| **Blob** | Limited | Generous | Custom |
| **Edge Config** | 256KB | 1MB+ | Custom |

## 💡 Usage Examples

### Using Postgres

```typescript
import { getAllPosts } from '@/lib/vercel-db';

// In your page component
const posts = await getAllPosts();
```

### Using Blob Storage

```typescript
import { uploadPostImage } from '@/lib/vercel-blob';

// Upload an image
const blob = await uploadPostImage(file, 'my-post-slug', 'image.jpg');
// Returns: { url: 'https://...', ... }
```

## 🚀 Migration from File-Based

If you want to migrate existing MDX posts to the database, you'll need to:

1. Set up the database (choose one above)
2. Create migration scripts to import MDX files
3. Update `lib/mdx.ts` to fetch from database instead of files
4. Keep MDX files as backup or remove them

## 🚀 Quick Start

1. **Deploy to Vercel** (if not already)
   ```bash
   vercel
   ```

2. **Add Postgres Database**
   - Vercel Dashboard → Storage → Create Database → Postgres

3. **Add Blob Storage**
   - Vercel Dashboard → Storage → Create Database → Blob

4. **Initialize Schema**
   - Visit: `https://your-app.vercel.app/api/init-db`
   - Or run SQL manually in Vercel dashboard

5. **Start Using**
   - Import functions from `@/lib/vercel-db` for posts
   - Import functions from `@/lib/vercel-blob` for files

## 📝 Migration from File-Based

To migrate existing MDX posts:

1. Set up Vercel Postgres and Blob (steps above)
2. Create a migration script to read MDX files and insert into database
3. Update your code to use `lib/vercel-db.ts` instead of `lib/mdx.ts`
4. Upload any images to Blob storage

## 💡 Recommendation

**Vercel Postgres + Blob** is perfect if you're deploying on Vercel - seamless integration, automatic environment variables, and great performance!

