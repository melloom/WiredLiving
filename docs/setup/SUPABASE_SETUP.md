# Supabase Setup Guide

This guide covers setting up **Supabase** for your blog (replacing Vercel Postgres and Blob).

## 🎯 Why Supabase?

- ✅ PostgreSQL database (powerful & reliable)
- ✅ Built-in file storage (for images, assets)
- ✅ Free tier: 500MB database + 1GB storage
- ✅ Easy to use with Next.js
- ✅ Great documentation
- ✅ Real-time capabilities

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: Your project name (e.g., "blog")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait for project to be created (2-3 minutes)

### 2. Get Your Credentials

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **service_role key** (this is your `SERVICE_ROLE_KEY` - keep this secret!)

### 3. Set Up Environment Variables

Create/update `.env.local` in your project root:

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: For client-side operations (if needed)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- `SERVICE_ROLE_KEY` is for server-side operations (admin functions)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is for client-side (if you need it)
- Never commit these to git!

### 4. Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create bucket**
3. Name it: `blog-images`
4. Set it to **Public** (so images are accessible)
5. Click **Create bucket**

### 5. Initialize Database Schema & Storage

**Option 1: Use Admin Dashboard (Easiest - Recommended)**

1. Start your dev server: `npm run dev`
2. Go to Admin Dashboard: `http://localhost:3000/admin`
3. In the **Quick Actions** section, click **🚀 Initialize Supabase (Tables + Storage)**
4. This will:
   - ✅ Create the storage bucket automatically (if it doesn't exist)
   - 📝 Provide SQL for tables (if they don't exist)
5. If SQL is provided, copy it and run in Supabase SQL Editor

**Option 2: Use API Endpoint**

1. Visit: `http://localhost:3000/api/admin/init-supabase` (POST request)
2. Or use the admin dashboard button (Option 1)

**Option 3: Run SQL File Directly**

1. Open `supabase-schema.sql` in your project
2. Copy all the SQL
3. Go to Supabase dashboard → **SQL Editor**
4. Click **New query**
5. Paste the SQL
6. Click **Run**

**Option 4: Use Command Line Script**

```bash
npm run init-supabase
```

This will check your setup and provide instructions.

### 6. Verify Setup

1. Restart your dev server: `npm run dev`
2. Go to Admin Dashboard
3. Try creating a post
4. Try uploading an image

## Database Schema

The following tables will be created:

- **posts** - All blog posts
- **tags** - Post tags
- **post_tags** - Relationship between posts and tags
- **admin_logs** - Admin activity logs

## Storage Buckets

- **blog-images** - For post cover images and gallery images

## Troubleshooting

### "Supabase not configured" error
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SERVICE_ROLE_KEY` are in `.env.local`
- Restart your dev server after adding environment variables

### "Tables do not exist" error
- Run the SQL schema in Supabase SQL Editor
- Check the `/api/init-db` endpoint response for the SQL

### Image upload fails
- Make sure the `blog-images` bucket exists in Supabase Storage
- Make sure the bucket is set to **Public**
- Check that `SERVICE_ROLE_KEY` has storage permissions

### Connection errors
- Verify your Supabase URL is correct
- Check that your project is active (not paused)
- Ensure you're using the service_role key (not anon key) for admin operations

## Migration from Vercel

If you were using Vercel Postgres/Blob:

1. Export your data from Vercel (if needed)
2. Set up Supabase as above
3. Run the SQL schema
4. Import data if you exported it
5. Update environment variables
6. Test everything works

## Next Steps

After setup:
- ✅ Create your first post in the admin dashboard
- ✅ Upload images to test storage
- ✅ Verify posts appear on your blog

