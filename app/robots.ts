import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = siteConfig.url || 'https://your-site.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/login'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

