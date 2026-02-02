import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, getAllSeriesMetadata } from '@/lib/supabase-db';
import type { BlogPost, SeriesMetadata } from '@/types';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Series | ' + siteConfig.name,
  description: 'Browse all post series on ' + siteConfig.name,
};

export default async function SeriesPage() {
  const posts: BlogPost[] = await getAllPosts();
  const seriesMetadataList: SeriesMetadata[] = await getAllSeriesMetadata();

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
  const sortedSeries = Array.from(seriesMap.entries()).map(([seriesName, seriesPosts]) => {
    // Find matching metadata by name (case-insensitive)
    const metadata = seriesMetadataList.find(
      (meta) => meta.name.trim().toLowerCase() === seriesName.trim().toLowerCase()
    );
    return {
      name: seriesName,
      posts: seriesPosts.sort((a, b) => {
        // First sort by seriesOrder if available
        const aOrder = a.seriesOrder ?? null;
        const bOrder = b.seriesOrder ?? null;
        if (aOrder !== null && bOrder !== null) {
          return aOrder - bOrder;
        }
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        // Then sort by date (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
      metadata,
    };
  });

  // Sort series by display_order (if available), then by name
  sortedSeries.sort((a, b) => {
    const aOrder = a.metadata?.display_order ?? null;
    const bOrder = b.metadata?.display_order ?? null;
    if (aOrder !== null && bOrder !== null) {
      return aOrder - bOrder;
    }
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return a.name.localeCompare(b.name);
  });

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

        {sortedSeries.length === 0 ? (
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
          <div className="grid gap-8 md:gap-10 max-w-5xl mx-auto">
            {sortedSeries.map((series) => {
              const firstPost = series.posts[0];
              const totalReadingTime = series.posts.reduce((acc, post) => acc + (post.readingTime || 0), 0);
              const meta = series.metadata;
              // Use color scheme from metadata if available
              const headerBg = meta?.color_scheme
                ? meta.color_scheme
                : 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700';
              return (
                <div 
                  key={series.name} 
                  className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Cover Image */}
                  {meta?.cover_image && (
                    <div className="absolute inset-0 h-56 md:h-64 w-full z-0">
                      <img
                        src={meta.cover_image}
                        alt={meta.name + ' cover'}
                        className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}
                  {/* Gradient Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Series Header */}
                  <div className={`relative ${headerBg} p-8 md:p-10 z-10`}>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                              {meta?.name || series.name}
                            </h2>
                          </div>
                          {/* Series Description from metadata */}
                          {meta?.description && (
                            <p className="text-white/90 text-base mb-2 max-w-xl line-clamp-2">
                              {meta.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-blue-50/90">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                              <span className="text-sm font-medium">{series.posts.length} {series.posts.length === 1 ? 'post' : 'posts'}</span>
                            </div>
                            {totalReadingTime > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">{totalReadingTime} min total</span>
                              </div>
                            )}
                            {firstPost.category && (
                              <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
                                <span className="text-sm font-medium">{firstPost.category}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/series/${encodeURIComponent(series.name)}`}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 ring-1 ring-white/30"
                        >
                          View Series
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Series Posts */}
                  <div className="relative p-6 md:p-8 z-10">
                    <div className="space-y-3">
                      {series.posts.slice(0, 3).map((post, index) => (
                        <article key={post.slug} className="group/post">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {/* Series Order Badge */}
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-lg group-hover/post:shadow-xl group-hover/post:scale-110 transition-all duration-200">
                              {post.seriesOrder || index + 1}
                            </div>
                            {/* Post Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-50 group-hover/post:text-blue-600 dark:group-hover/post:text-blue-400 transition-colors mb-1.5 line-clamp-2">
                                {post.title}
                              </h3>
                              {post.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                                  {post.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                <time className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(post.date)}
                                </time>
                                {post.readingTime && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {post.readingTime} min
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Arrow Icon */}
                            <div className="flex-shrink-0 text-gray-400 group-hover/post:text-blue-600 dark:group-hover/post:text-blue-400 group-hover/post:translate-x-1 transition-all duration-200">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        </article>
                      ))}
                      {/* Show More Link */}
                      {series.posts.length > 3 && (
                        <Link
                          href={`/series/${encodeURIComponent(series.name)}`}
                          className="flex items-center justify-center gap-2 p-3 mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors"
                        >
                          <span>View all {series.posts.length} posts in this series</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}