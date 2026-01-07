import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTags, getAllPosts } from '@/lib/mdx';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Tags',
  description: `Browse all tags and topics on ${siteConfig.name}`,
  openGraph: {
    title: `Tags | ${siteConfig.name}`,
    description: `Browse all tags and topics`,
    ...(siteConfig.url && { url: `${siteConfig.url}/tags` }),
  },
};

export default function TagsPage() {
  const tags = getAllTags();
  const posts = getAllPosts();

  // Count posts per tag
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = posts.filter(post => post.tags.includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = [...tags].sort((a, b) => tagCounts[b] - tagCounts[a]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Tags</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Explore posts by topic
          </p>

          {tags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No tags yet. Posts will be tagged as you create them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTags.map((tag) => {
                const count = tagCounts[tag];
                return (
                  <Link
                    key={tag}
                    href={`/blog/tag/${tag}`}
                    className="block p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg bg-white dark:bg-gray-900"
                  >
                    <h2 className="text-xl font-semibold mb-2">{tag}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {count} {count === 1 ? 'post' : 'posts'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

