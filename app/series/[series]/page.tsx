import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getSeriesMetadata } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export async function generateMetadata({ params }: { params: Promise<{ series: string }> | { series: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const seriesName = decodeURIComponent(resolvedParams.series);

  return {
    title: `${seriesName} | Series | ${siteConfig.name}`,
    description: `All posts in the "${seriesName}" series on ${siteConfig.name}`,
  };
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ series: string }> | { series: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const seriesName = decodeURIComponent(resolvedParams.series);

  const posts = await getAllPosts();
  const metadata = await getSeriesMetadata(seriesName);

  // Filter posts for this series
  const seriesPosts = posts.filter(post => post.series === seriesName);

  if (seriesPosts.length === 0) {
    notFound();
  }

  // Sort posts by seriesOrder, then by date
  seriesPosts.sort((a, b) => {
    const aOrder = a.seriesOrder ?? null;
    const bOrder = b.seriesOrder ?? null;
    if (aOrder !== null && bOrder !== null) {
      return aOrder - bOrder;
    }
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    // Then sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* Cover Image */}
          {metadata?.cover_image && (
            <div className="absolute inset-0 top-0 left-1/2 -translate-x-1/2 w-full h-56 md:h-64 z-0">
              <img
                src={metadata.cover_image}
                alt={metadata.name + ' cover'}
                className="object-cover w-full h-full opacity-80"
                style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50">
              {metadata?.name || seriesName}
            </h1>
          </div>
          {/* Series Description from metadata */}
          {metadata?.description ? (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4 relative z-10">
              {metadata.description}
            </p>
          ) : (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4 relative z-10">
              A curated series exploring {seriesName.toLowerCase()}.
            </p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 relative z-10">
            <span>{seriesPosts.length} {seriesPosts.length === 1 ? 'post' : 'posts'} in this series</span>
            <span>•</span>
            <Link
              href="/series"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              ← View all series
            </Link>
          </div>
        </div>

        {/* Posts List */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {seriesPosts.map((post, index) => (
              <article key={post.slug} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      {/* Series Order Indicator */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-lg">
                        {post.seriesOrder || index + 1}
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          {post.featured && (
                            <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                              {post.category}
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3">
                          {post.title}
                        </h2>

                        {post.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4">
                            {post.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(post.date)}
                          </span>
                          {post.readingTime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {post.readingTime} min read
                              </span>
                            </>
                          )}
                          {post.wordCount && (
                            <>
                              <span>•</span>
                              <span>{post.wordCount.toLocaleString()} words</span>
                            </>
                          )}
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}