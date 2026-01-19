import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/supabase-db';
import { siteConfig } from '@/config/site';
import { SearchPageClient } from '@/components/search-page-client';

export const metadata: Metadata = {
  title: 'Search Articles & Posts | WiredLiving',
  description: 'Search all articles, stories, and posts on WiredLiving. Find content by keywords, tags, categories, or topics.',
  keywords: ['search WiredLiving', 'find articles', 'search posts', 'blog search', 'find stories', 'content search'],
  openGraph: {
    title: 'Search Articles & Posts | WiredLiving',
    description: 'Search all articles, stories, and posts. Find content by keywords, tags, or topics.',

    ...(siteConfig.url && { url: `${siteConfig.url}/search` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Search - ${siteConfig.name}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SearchPage() {
  const posts = await getAllPosts();

  return <SearchPageClient posts={posts} />;
}

