import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTags, getAllPosts } from '@/lib/supabase-db';
import { siteConfig } from '@/config/site';
import { TagCloud } from '@/components/tag-cloud';

export const metadata: Metadata = {
  title: 'Tags | Browse All Topics',
  description: `Explore all tags and topics on ${siteConfig.name}. Find posts by category, technology, or subject matter.`,
  keywords: [
    'Tags',
    'Topics',
    'Categories',
    'Blog Tags',
    'Browse Posts',
    'Content Categories',
    siteConfig.name,
  ],
  openGraph: {
    title: `Tags | ${siteConfig.name}`,
    description: `Explore all tags and topics on ${siteConfig.name}. Find posts by category, technology, or subject matter.`,
    ...(siteConfig.url && { url: `${siteConfig.url}/tags` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage || '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tags Page',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Tags | ${siteConfig.name}`,
    description: `Explore all tags and topics on ${siteConfig.name}.`,
    images: [siteConfig.ogImage || '/og-image.jpg'],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/tags`,
    },
  }),
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TagsPage() {
  const tags = await getAllTags();
  const posts = await getAllPosts();

  // Count posts per tag
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = posts.filter(post => (post.tags || []).includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  // Create tag objects with counts
  const tagsWithCounts = tags.map(tag => ({
    name: tag,
    count: tagCounts[tag],
  }));

  // Sort by count (popular first)
  const sortedTags = [...tagsWithCounts].sort((a, b) => b.count - a.count);
  
  // Get popular tags (top 10)
  const popularTags = sortedTags.slice(0, 10);
  
  // Get all other tags
  const otherTags = sortedTags.slice(10);

  const totalPosts = posts.length;
  const totalTags = tags.length;
  const averagePostsPerTag = totalTags > 0 ? (totalPosts / totalTags).toFixed(1) : '0';

  // Create structured data
  const tagsPageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Tags | ${siteConfig.name}`,
    description: 'Browse all tags and topics',
    ...(siteConfig.url && { url: `${siteConfig.url}/tags` }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalTags,
      itemListElement: tagsWithCounts.map((tag, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tag.name,
        ...(siteConfig.url && { url: `${siteConfig.url}/blog/tag/${encodeURIComponent(tag.name)}` }),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tagsPageSchema) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {totalTags} Tags • {totalPosts} Posts
                  </span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Explore by Topic
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Discover articles organized by topics. Click any tag to see all posts about that subject, or browse popular topics below.
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {totalTags}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Tags
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {totalPosts}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Posts
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {averagePostsPerTag}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Avg Posts/Tag
                </div>
              </div>
            </div>

            {tags.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-6xl mb-4">🏷️</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We&apos;re organizing our content with tags. Check back soon!
                </p>
                <Link
                  href="/blog"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  View All Posts
                </Link>
              </div>
            ) : (
              <>
                {/* Popular Tags Section with Post Previews */}
                {popularTags.length > 0 && (
                  <section className="mb-16">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          Popular Topics
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Most discussed subjects
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularTags.map((tag) => {
                          // Get recent posts for this tag
                          const tagPosts = posts
                            .filter(post => (post.tags || []).includes(tag.name))
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 3);
                          
                          return (
                            <div
                              key={tag.name}
                              className="group bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg overflow-hidden"
                            >
                              <Link href={`/blog/tag/${encodeURIComponent(tag.name)}`}>
                                <div className="p-5">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {tag.name}
                                    </h3>
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                                      {tag.count}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {tag.count} {tag.count === 1 ? 'article' : 'articles'} on this topic
                                  </p>
                                  
                                  {/* Recent Posts Preview */}
                                  {tagPosts.length > 0 && (
                                    <div className="space-y-2 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Latest Posts
                                      </p>
                                      {tagPosts.map((post) => (
                                        <Link
                                          key={post.slug}
                                          href={`/blog/${post.slug}`}
                                          className="block group/post"
                                        >
                                          <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                                            {post.coverImage && (
                                              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={post.coverImage}
                                                  alt={post.title}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover/post:text-blue-600 dark:group-hover/post:text-blue-400 transition-colors line-clamp-2">
                                                {post.title}
                                              </p>
                                              {post.readingTime && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                  {post.readingTime} min read
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                      View all {tag.count} {tag.count === 1 ? 'post' : 'posts'} →
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* Tag Cloud Section */}
                <section className="mb-16">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        All Tags
                      </h2>
                    </div>
                    <TagCloud tags={sortedTags} />
                  </div>
                </section>

                {/* All Tags Grid */}
                {otherTags.length > 0 && (
                  <section className="mb-16">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-lg">
                      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                        More Tags
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {otherTags.map((tag) => (
                          <Link
                            key={tag.name}
                            href={`/blog/tag/${encodeURIComponent(tag.name)}`}
                            className="group p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md"
                          >
                            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tag.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {tag.count} {tag.count === 1 ? 'post' : 'posts'}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* How to Use Section */}
            <section className="mb-16">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    How to Use Tags
                  </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">🔍</div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Discover Topics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse tags to find articles about specific subjects that interest you.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">📚</div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Explore Collections</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click any tag to see all posts related to that topic in one place.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">⭐</div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Follow Interests</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Popular tags show the most discussed topics. Great for finding trending content.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <div className="inline-block p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Want to see all posts in chronological order?
                </p>
                <Link
                  href="/blog"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Browse All Posts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
