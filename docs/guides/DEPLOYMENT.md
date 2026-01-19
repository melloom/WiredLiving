# Deployment Guide

This guide covers deploying your blog to various platforms.

## Prerequisites

- Your blog code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally (for CLI deployments)

## Deploy to Vercel (Recommended)

Vercel is the recommended platform for Next.js applications as it's made by the Next.js team.

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

## Deploy to Netlify

### Option 1: Deploy via Netlify CLI

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Build your project:
```bash
npm run build
```

4. Deploy:
```bash
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Go to [netlify.com](https://www.netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Click "Deploy site"

## Environment Variables

If you need to set environment variables:

### Vercel
- Go to Project Settings → Environment Variables
- Add your variables
- Redeploy

### Netlify
- Go to Site Settings → Environment Variables
- Add your variables
- Redeploy

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

Both Vercel and Netlify support automatic deployments:
- Every push to `main` branch triggers a production deployment
- Pull requests get preview deployments automatically

## Build Optimization

Your Next.js app is already optimized with:
- Automatic code splitting
- Image optimization
- Static generation for blog posts
- Server-side rendering where needed

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run type-check`

### Posts Not Showing
- Verify posts are in `content/posts/` directory
- Check frontmatter format in posts
- Ensure `published: true` in frontmatter

### Styling Issues
- Verify Tailwind CSS is properly configured
- Check `tailwind.config.ts` includes all content paths
- Rebuild: `npm run build`

## Performance Tips

1. **Optimize Images**: Use Next.js Image component for all images
2. **Enable Compression**: Both platforms enable this automatically
3. **Use CDN**: Both platforms provide global CDN automatically
4. **Monitor Performance**: Use Vercel Analytics or Netlify Analytics

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)


