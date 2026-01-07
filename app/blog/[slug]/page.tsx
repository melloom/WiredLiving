import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { MDXContent } from '@/components/mdx-content';
import { ReadingProgress } from '@/components/reading-progress';
import { ShareButtons } from '@/components/share-buttons';
import { TableOfContents } from '@/components/table-of-contents';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { PostLikes } from '@/components/post-likes';
import { PrintExport } from '@/components/print-export';
import { ReadingHistoryTracker } from '@/components/reading-history-tracker';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found',
    };
  }

  const url = siteConfig.url ? `${siteConfig.url}/blog/${resolvedParams.slug}` : undefined;
  const ogImage = post.coverImage || siteConfig.ogImage || '/og-image.jpg';
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;

  return {
    title,
    description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      ...(url && { url }),
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(siteConfig.author.twitter && { creator: siteConfig.author.twitter }),
      images: [ogImage],
    },
    ...(url && {
      alternates: {
        canonical: url,
      },
    }),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 4);

  const articleUrl = siteConfig.url ? `${siteConfig.url}/blog/${resolvedParams.slug}` : undefined;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': post.structuredDataType || 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    keywords: post.tags.join(', '),
    ...(post.canonicalUrl
      ? { mainEntityOfPage: post.canonicalUrl }
      : articleUrl && { mainEntityOfPage: articleUrl }),
    ...(post.coverImage && {
      image: post.coverImage,
    }),
    ...(post.category && {
      articleSection: post.category,
    }),
    ...(post.series && {
      partOfSeries: {
        '@type': 'CreativeWorkSeries',
        name: post.series,
      },
      ...(post.seriesOrder && { position: post.seriesOrder }),
    }),
  };

  return (
    <>
      <AnalyticsTracker postSlug={post.slug} pageTitle={post.title} />
      <ReadingProgress />
      <ReadingHistoryTracker postSlug={post.slug} />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        {/* Breadcrumbs */}
        <div className="border-b border-gray-200/80 dark:border-gray-800/80 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="max-w-5xl mx-auto">
              <nav className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Blog
                </Link>
                {post.category && (
                  <>
                    <span>/</span>
                    <Link 
                      href={`/blog/category/${encodeURIComponent(post.category)}`}
                      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      {post.category}
                    </Link>
                  </>
                )}
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">
                  {post.title}
                </span>
              </nav>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12">
            {/* Main article */}
            <article className="min-w-0">
              {/* Hero Section */}
              <header className="space-y-6 mb-8">
                <div className="space-y-4">
                  {/* Category & Date */}
                  <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                    {post.category && (
                      <Link
                        href={`/blog/category/${encodeURIComponent(post.category)}`}
                        className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {post.category}
                      </Link>
                    )}
                    {post.series && (
                      <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                        Series: {post.series}
                        {post.seriesOrder && ` #${post.seriesOrder}`}
                      </span>
                    )}
                    {post.featured && (
                      <span className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium flex items-center gap-1">
                        <span>⭐</span>
                        <span>Featured</span>
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDate(post.date)}
                    </span>
                    {post.readingTime && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {post.readingTime} min read
                        </span>
                      </>
                    )}
                    {post.wordCount && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {post.wordCount.toLocaleString()} words
                        </span>
                      </>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-tight">
                    {post.title}
                  </h1>

                  {post.description && (
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                      {post.description}
                    </p>
                  )}

                  {/* Author & Meta */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {post.author}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Published {formatDate(post.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Share Buttons, Likes, and Print Export */}
                  {articleUrl && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                      <ShareButtons url={articleUrl} title={post.title} description={post.description} />
                      <div className="flex items-center gap-4 flex-wrap">
                        <PostLikes postSlug={post.slug} />
                        <PrintExport postTitle={post.title} postSlug={post.slug} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Image */}
                {post.coverImage && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover"
                    />
                  </div>
                )}
              </header>

              {/* Article body with TOC */}
              <div className="grid md:grid-cols-[1fr_280px] gap-8">
                <div className="min-w-0">
                  <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-code:text-pink-600 dark:prose-code:text-pink-400">
                    {post.content && <MDXContent content={post.content} />}
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags:</span>
                        {post.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/blog/tag/${encodeURIComponent(tag)}`}
                            className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author Bio */}
                  <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {post.author}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Writer at {siteConfig.name}. Sharing insights on technology, development, and innovation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next/Previous Navigation */}
                  {(nextPost || prevPost) && (
                    <div className="mt-12 grid md:grid-cols-2 gap-4">
                      {prevPost && (
                        <Link
                          href={`/blog/${prevPost.slug}`}
                          className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900"
                        >
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Previous Post</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {prevPost.title}
                          </div>
                        </Link>
                      )}
                      {nextPost && (
                        <Link
                          href={`/blog/${nextPost.slug}`}
                          className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900 text-right"
                        >
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Next Post</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {nextPost.title}
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Sticky Sidebar */}
                <aside className="hidden md:block space-y-6 lg:sticky lg:top-24 h-fit">
                  {/* Table of Contents */}
                  {post.content && <TableOfContents content={post.content} />}

                  {/* Post Stats */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Article Stats
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reading time</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {post.readingTime ? `${post.readingTime} min` : '—'}
                        </span>
                      </div>
                      {post.wordCount && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Word count</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {post.wordCount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Published</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(post.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Newsletter Signup */}
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white relative">
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
                    <p className="text-sm text-blue-100 mb-4">
                      Get the latest posts delivered to your inbox.
                    </p>
                    <form className="space-y-2 opacity-60 pointer-events-none">
                      <input
                        type="email"
                        placeholder="Your email"
                        disabled
                        className="w-full px-4 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled
                        className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold transition-colors text-sm cursor-not-allowed opacity-50"
                      >
                        Subscribe
                      </button>
                    </form>
                  </div>
                </aside>
              </div>

              {/* Gallery section */}
              {post.galleryImages && post.galleryImages.length > 0 && (
                <section className="mt-12 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {post.galleryImages.map((url, idx) => (
                      <div
                        key={url + idx}
                        className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 group cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={url} 
                          alt={`Gallery image ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                    Related Posts
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost.slug}
                        href={`/blog/${relatedPost.slug}`}
                        className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {relatedPost.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(relatedPost.date)}</span>
                          {relatedPost.readingTime && (
                            <>
                              <span>•</span>
                              <span>{relatedPost.readingTime} min read</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
