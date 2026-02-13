# Quick Start Guide

Get your blog up and running in minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Customize Site Configuration

Edit `config/site.ts` with your information:

```typescript
export const siteConfig = {
  name: 'Your Blog Name',
  description: 'Your blog description',
  url: 'https://yourdomain.com',
  author: {
    name: 'Your Name',
    email: 'your.email@example.com',
    twitter: '@yourhandle',
    github: 'yourusername',
  },
  // ...
};
```

## Step 3: Create Your First Blog Post

Create a file in `content/posts/my-first-post.mdx`:

```mdx
---
title: "My First Blog Post"
description: "This is my first blog post"
date: "2024-01-15"
author: "Your Name"
tags: ["introduction"]
published: true
---

# My First Blog Post

Write your content here using **markdown**!

## Features

- Easy to write
- Markdown support
- Code highlighting
```

## Step 4: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your blog!

## Step 5: Build for Production

```bash
npm run build
npm start
```

## Next Steps

- Add more blog posts to `content/posts/`
- Customize styling in `app/globals.css`
- Add custom components in `components/`
- Deploy to Vercel or Netlify (see `DEPLOYMENT.md`)

## Tips

- Use frontmatter in your posts for metadata
- Set `published: false` to hide posts during development
- Use tags to organize your content
- Check the example post in `content/posts/example-post.mdx`

Happy blogging! 🎉


