import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/supabase-db';
import type { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Series | ' + siteConfig.name,
  description: 'Browse all post series on ' + siteConfig.name,
};

export default async function SeriesPage() {
  const posts: BlogPost[] = await getAllPosts();

  // Group posts by normalized series name
  const seriesMap = new Map<string, BlogPost[]>();

  posts.forEach((post) => {
    const seriesName = post.series ? String(post.series).trim() : '';
    if (!seriesName) return;
    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, []);
    }
    seriesMap.get(seriesName)!.push(post);
  });

  // Sort posts within each series by seriesOrder, then by date
  const sortedSeries = Array.from(seriesMap.entries()).map(([seriesName, seriesPosts]) => ({
    name: seriesName,
    posts: seriesPosts.sort((a, b) => {
      // First sort by seriesOrder if available
      if (a.seriesOrder !== null && b.seriesOrder !== null) {
        return a.seriesOrder - b.seriesOrder;
      }
      if (a.seriesOrder !== null) return -1;
      if (b.seriesOrder !== null) return 1;
      // Then sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }),
  }));

  // Sort series by name
  sortedSeries.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Post Series
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our curated series of related posts, organized for deeper learning and discovery.
          </p>
        </div>

        {true ? (
          <div className="text-center py-16">
            <div className="mx-auto max-w-xl">
              <div className="text-7xl mb-6">🚧</div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3">
                Series Coming Soon
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                We're preparing curated multi-part series to deep-dive into topics. Sign up to be notified when the first series launches.
              </p>
              <div className="flex items-center justify-center">
                <Link href="/blog" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow">
                  Browse blog posts
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:gap-12">
            {sortedSeries.map((series) => (
              <div key={series.name} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                {/* Series Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {series.name}
                    </h2>
                  </div>
                  <p className="text-blue-100 text-sm md:text-base">
                    {series.posts.length} {series.posts.length === 1 ? 'post' : 'posts'} in this series
                  </p>
                </div>

                {/* Series Posts */}
                <div className="p-6 md:p-8">
                  <div className="space-y-4">
                    {series.posts.map((post, index) => (
                      <article key={post.slug} className="group">
                        <div className="flex items-start gap-4">
                          {/* Series Order Indicator */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
                            {post.seriesOrder || index + 1}
                          </div>

                          {/* Post Content */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="block group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 -m-2 p-2 rounded-lg transition-colors"
                            >
                              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                                {post.title}
                              </h3>
                              {post.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base line-clamp-2 mb-2">
                                  {post.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatDate(post.date)}</span>
                                {post.readingTime && (
                                  <>
                                    <span>•</span>
                                    <span>{post.readingTime} min read</span>
                                  </>
                                )}
                                {post.wordCount && (
                                  <>
                                    <span>•</span>
                                    <span>{post.wordCount.toLocaleString()} words</span>
                                  </>
                                )}
                              </div>
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}