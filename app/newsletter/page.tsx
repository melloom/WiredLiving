import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { NewsletterClient } from '@/components/newsletter-client';

export const metadata: Metadata = {
  title: 'Newsletter | Subscribe for Updates',
  description: `Subscribe to ${siteConfig.name} newsletter to get notified about new posts, tutorials, and updates. Never miss a new article.`,
  keywords: ['Newsletter', 'Subscribe', 'Email Updates', 'Blog Updates'],
  openGraph: {
    title: `Newsletter | ${siteConfig.name}`,
    description: 'Subscribe to get notified about new posts and updates',
    ...(siteConfig.url && { url: `${siteConfig.url}/newsletter` }),
    siteName: siteConfig.name,
    type: 'website',
  },
};

export default function NewsletterPage() {
  return <NewsletterClient />;
}

