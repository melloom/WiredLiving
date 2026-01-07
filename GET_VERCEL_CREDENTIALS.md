# How to Get Vercel Postgres Credentials

## Step-by-Step Guide

### 1. Go to Your Vercel Project Dashboard

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click on your project (or go to: https://vercel.com/melvins-projects-f098e0f5/blog)

### 2. Create Postgres Database

1. In your project dashboard, click on the **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose your plan (Hobby is free)
5. Give it a name (e.g., "blog-db")
6. Click **Create**

### 3. Get Your Connection Strings

After creating the database, Vercel automatically adds these environment variables:

1. Go to **Settings** → **Environment Variables** in your project
2. You should see these variables automatically added:
   - `POSTGRES_URL` - Main connection string (pooled)
   - `POSTGRES_PRISMA_URL` - For Prisma (if using)
   - `POSTGRES_URL_NON_POOLING` - Direct connection (for migrations)

### 4. If Variables Are Missing

If you don't see `POSTGRES_URL_NON_POOLING`:

1. Go to **Storage** tab
2. Click on your Postgres database
3. Click on the **.env.local** tab
4. Copy all the connection strings shown there
5. Manually add `POSTGRES_URL_NON_POOLING` to your environment variables if needed

### 5. For Local Development

1. In Vercel dashboard, go to **Storage** → Your Postgres database
2. Click on **.env.local** tab
3. Copy all the connection strings
4. Create `.env.local` file in your project root:
   ```env
   POSTGRES_URL=your-postgres-url-here
   POSTGRES_PRISMA_URL=your-prisma-url-here
   POSTGRES_URL_NON_POOLING=your-non-pooling-url-here
   ```

### 6. Alternative: Get from Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Pull environment variables
vercel env pull .env.local
```

This will download all environment variables including the Postgres URLs.

## Important Notes

- **POSTGRES_URL** - Use this for most queries (pooled connection)
- **POSTGRES_URL_NON_POOLING** - Use for migrations or direct connections
- **POSTGRES_PRISMA_URL** - Only needed if using Prisma ORM

For this blog project, we primarily use `POSTGRES_URL`, but having `POSTGRES_URL_NON_POOLING` is good for migrations.

## Quick Check

To verify your database is set up:

1. Visit: `https://your-app.vercel.app/api/init-db`
2. Or check Vercel dashboard → Storage → Your database → Query tab

If you see connection errors, make sure:
- Database is created in Vercel
- Environment variables are set
- You've redeployed after adding the database

