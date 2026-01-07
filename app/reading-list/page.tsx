import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { ReadingListClient } from '@/components/reading-list-client';

export const metadata: Metadata = {
  title: 'Reading List | Saved Posts',
  description: `View your saved posts and reading list on ${siteConfig.name}. Access your bookmarked articles anytime.`,
  keywords: ['Reading List', 'Bookmarks', 'Saved Posts', 'Reading List'],
  openGraph: {
    title: `Reading List | ${siteConfig.name}`,
    description: 'View your saved posts and reading list',
    ...(siteConfig.url && { url: `${siteConfig.url}/reading-list` }),
    siteName: siteConfig.name,
    type: 'website',
  },
  robots: {
    index: false, // Don't index reading lists
    follow: false,
  },
};

export default function ReadingListPage() {
  return <ReadingListClient />;
}

