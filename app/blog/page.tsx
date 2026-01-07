import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Browse all blog posts and articles on ' + siteConfig.name,
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description: 'Browse all blog posts and articles',
    url: `${siteConfig.url}/blog`,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Blog | ${siteConfig.name}`,
    description: 'Browse all blog posts and articles',
  },
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            All posts
          </p>

          {tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${tag}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No posts yet. Create your first post in the content/posts directory!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="border-b border-gray-200 dark:border-gray-800 pb-8"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-2xl font-semibold mb-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{formatDate(post.date)}</span>
                      <span>by {post.author}</span>
                      {post.readingTime && (
                        <span>{post.readingTime} min read</span>
                      )}
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/blog/tag/${tag}`}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

