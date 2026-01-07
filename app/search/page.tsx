import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/supabase-db';
import { siteConfig } from '@/config/site';
import { SearchPageClient } from '@/components/search-page-client';

export const metadata: Metadata = {
  title: 'Search | Find Posts',
  description: `Search through all posts on ${siteConfig.name}. Find articles by title, content, tags, or author.`,
  keywords: ['Search', 'Find Posts', 'Blog Search', 'Content Search'],
  openGraph: {
    title: `Search | ${siteConfig.name}`,
    description: `Search through all posts on ${siteConfig.name}`,
    ...(siteConfig.url && { url: `${siteConfig.url}/search` }),
    siteName: siteConfig.name,
    type: 'website',
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

