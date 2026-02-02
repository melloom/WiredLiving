import type { Metadata } from 'next';
import Link from 'next/link';
import { getPostsByTag, getAllTags } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> | { tag: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const decodedTag = decodeURIComponent(resolvedParams.tag);
  const posts = await getPostsByTag(decodedTag);
  const title = `Posts tagged "${decodedTag}" | ${siteConfig.name}`;
  const description = `Browse ${posts.length} ${posts.length === 1 ? 'post' : 'posts'} tagged with "${decodedTag}"`;

  return {
    title: `Tag: ${decodedTag} | ${siteConfig.name}`,
    description,
    keywords: [decodedTag, 'Tag', 'Blog Tag', siteConfig.name],
    openGraph: {
      title,
      description,
      ...(siteConfig.url && { url: `${siteConfig.url}/blog/tag/${encodeURIComponent(decodedTag)}` }),
      siteName: siteConfig.name,
      type: 'website',
      images: [
        {
          url: siteConfig.ogImage || '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Posts tagged "${decodedTag}"`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig.ogImage || '/og-image.jpg'],
      ...(siteConfig.author.twitter && { creator: `@${siteConfig.author.twitter}` }),
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(siteConfig.url && {
      alternates: {
        canonical: `${siteConfig.url}/blog/tag/${encodeURIComponent(decodedTag)}`,
      },
    }),
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> | { tag: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const decodedTag = decodeURIComponent(resolvedParams.tag);
  const posts = await getPostsByTag(decodedTag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8 inline-block"
          >
            ← Back to Blog
          </Link>

          <h1 className="text-4xl font-bold mb-4">
            Posts tagged: <span className="text-blue-600 dark:text-blue-400">{decodedTag}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
          </p>

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
                  {(post.tags || []).length > 0 && (
                    <div className="flex gap-2">
                      {(post.tags || []).map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog/tag/${tag}`}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            tag === decodedTag
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
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
        </div>
      </div>
    </main>
  );
}

