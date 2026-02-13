import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamicImport from 'next/dynamic';
import { getPostBySlug, getAllPosts } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { MDXContent } from '@/components/mdx-content';
import { ReadingProgress } from '@/components/reading-progress';
import { ShareButtons } from '@/components/share-buttons';
import { TableOfContents } from '@/components/table-of-contents';
import { PostActionButtons } from '@/components/post-action-buttons';

// Utility: Detect inline [TOC] marker (case-insensitive)
function detectInlineTOC(content: string) {
  return typeof content === 'string' && /\[TOC\]/i.test(content);
}
import { ContentQuickLinks } from '@/components/content-quick-links';
import { BackToTop } from '@/components/back-to-top';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { PostLikes } from '@/components/post-likes';
import { ReadingHistoryTracker } from '@/components/reading-history-tracker';
import { StickyMusicPlayer } from '@/components/sticky-music-player';
import { siteConfig } from '@/config/site';

// Dynamic imports for heavy components (lazy loaded). Next.js 16: ssr:false only in Client Components.
const NewsFeed = dynamicImport(() => import('@/components/news-feed').then(mod => ({ default: mod.NewsFeed })), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const SidebarWeather = dynamicImport(() => import('@/components/sidebar-weather').then(mod => ({ default: mod.SidebarWeather })), {
  loading: () => <div className="animate-pulse h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const SidebarContact = dynamicImport(() => import('@/components/sidebar-contact').then(mod => ({ default: mod.SidebarContact })), {
  loading: () => <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const SidebarGallery = dynamicImport(() => import('@/components/sidebar-gallery').then(mod => ({ default: mod.SidebarGallery })), {
  loading: () => <div className="animate-pulse h-52 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const SidebarClock = dynamicImport(() => import('@/components/sidebar-clock').then(mod => ({ default: mod.SidebarClock })), {
  loading: () => <div className="animate-pulse h-52 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const MusicPlayer = dynamicImport(() => import('@/components/music-player').then(mod => ({ default: mod.MusicPlayer })), {
  loading: () => <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>,
});
const BlogPostMobileWidget = dynamicImport(() => import('@/components/blog-post-mobile-widget').then(mod => ({ default: mod.BlogPostMobileWidget })), {});

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
  const ogImage = post.ogImageOverride || post.coverImage || siteConfig.ogImage || '/og-image.jpg';
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;
  const canonicalUrl = post.canonicalUrl || url;

  return {
    title,
    description,
    keywords: post.tags || [],
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
      title: post.twitterTitle || title,
      description: post.twitterDescription || description,
      ...(siteConfig.author.twitter && { creator: siteConfig.author.twitter }),
      images: [ogImage],
    },
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    other: {
      ...(post.coverImage && {
        'preload-image': post.coverImage,
      }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Debug: Log sidebar widgets setting
  console.log(`[${post.slug}] sidebarWidgets:`, JSON.stringify(post.sidebarWidgets, null, 2));
  console.log(`[${post.slug}] showTableOfContents value:`, post.sidebarWidgets?.showTableOfContents);
  console.log(`[${post.slug}] Will show TOC:`, post.sidebarWidgets?.showTableOfContents === true);

  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  // Previous post = older post (higher index, posted before current)
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  // Next post = newer post (lower index, posted after current)
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && (p.tags || []).some((tag) => (post.tags || []).includes(tag)))
    .slice(0, 4);

  // Generate keywords for news feed from post tags, category, and title
  const newsKeywords = [
    ...(post.tags || []),
    post.category,
    ...(post.title.split(' ').filter((word: string) => word.length > 4).slice(0, 3)),
  ]
    .filter(Boolean)
    .join(',');

  const articleUrl = siteConfig.url ? `${siteConfig.url}/blog/${resolvedParams.slug}` : undefined;

  // Detect inline TOC marker in content to avoid duplicate sidebar TOC
  const hasInlineTOC = typeof post.content === 'string' && /(^|\n)\s*\[toc\]\s*($|\n)/i.test(post.content);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': post.structuredDataType || 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      ...(siteConfig.url && { url: siteConfig.url }),
      ...(siteConfig.ogImage && {
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}${siteConfig.ogImage}`,
        },
      }),
    },
    ...(post.coverImage && {
      image: {
        '@type': 'ImageObject',
        url: post.coverImage,
      },
    }),
    keywords: (post.tags || []).join(', '),
    ...(post.canonicalUrl
      ? { mainEntityOfPage: post.canonicalUrl }
      : articleUrl && { mainEntityOfPage: articleUrl }),
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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        {/* Breadcrumbs */}
        <div className="border-b border-gray-200/80 dark:border-gray-800/80 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm overflow-x-auto">
          <div className="container mx-auto px-4 py-3 min-w-0">
            <div className="max-w-5xl mx-auto">
              <nav className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-nowrap min-w-0">
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
                <span className="text-gray-900 dark:text-gray-100 font-medium flex-1 truncate min-w-0">
                  {post.title}
                </span>
              </nav>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 pb-24 lg:pb-12">
          {/* Hero Section */}
          <header className="mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg relative overflow-hidden contain-layout">
              {/* Simplified decorative background - optimized for performance */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-2xl -z-0 will-change-transform" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/5 to-blue-400/5 rounded-full blur-2xl -z-0 will-change-transform" />

              <div className="relative z-10">
                {/* Top Meta Bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  {post.featured && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-yellow-900 font-bold flex items-center gap-1.5 shadow-md">
                      <span>⭐</span>
                      <span>Featured</span>
                    </span>
                  )}
                  {post.category && (
                    <Link
                      href={`/blog/category/${encodeURIComponent(post.category)}`}
                      className="px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-500/20 dark:hover:bg-blue-400/30 transition-all border border-blue-500/30 dark:border-blue-400/30"
                    >
                      {post.category}
                    </Link>
                  )}
                  {post.series && (
                    <Link
                      href={`/series/${encodeURIComponent(post.series)}`}
                      className="px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-400/20 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-500/20 dark:hover:bg-purple-400/30 transition-all border border-purple-500/30 dark:border-purple-400/30"
                    >
                      Series: {post.series}{post.seriesOrder && ` #${post.seriesOrder}`}
                    </Link>
                  )}
                </div>

                {/* Title with gradient */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-3 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-50 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                  {post.title}
                </h1>

                {/* Description with styling */}
                {post.description && (
                  <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4 pl-4 border-l-2 border-blue-500">
                    {post.description}
                  </p>
                )}

                {/* Stats Bar - New compact info section */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(post.date)}</span>
                  </div>
                  {post.readingTime && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{post.readingTime} min read</span>
                    </div>
                  )}
                  {post.wordCount && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">{post.wordCount.toLocaleString()} words</span>
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">{post.tags.length} {post.tags.length === 1 ? 'tag' : 'tags'}</span>
                    </div>
                  )}
                </div>

                {/* Author & Actions Row */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-300/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2.5">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.author}
                        className="w-9 h-9 rounded-full border-2 border-blue-400/50 dark:border-blue-500/50 object-cover ring-2 ring-blue-100 dark:ring-blue-900/30"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-semibold text-white text-sm shadow-md">
                        {post.author?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'MP'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {post.author}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Author
                      </div>
                    </div>
                  </div>
                  {articleUrl && (
                    <>
                      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
                      <div className="flex items-center gap-2">
                        <ShareButtons url={articleUrl} title={post.title} description={post.description} />
                        <PostLikes postSlug={post.slug} />
                      </div>
                      <PostActionButtons postSlug={post.slug} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mt-4 -mx-4 md:mx-0">
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-lg relative aspect-[21/9] sm:aspect-video lg:aspect-[21/9]">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    priority
                    fetchPriority="high"
                    quality={90}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                    className="object-cover object-center"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                  />
                </div>
              </div>
            )}
          </header>

          {/* Content Grid with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 contain-layout">
            {/* Main article content */}
            <article className="min-w-0 contain-content">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 lg:p-12 shadow-xl border border-gray-200/50 dark:border-gray-800/50 contain-layout">
                  <div className="max-w-4xl mx-auto min-w-0 contain-content">
                    <div className="prose prose-lg md:prose-xl lg:prose-2xl dark:prose-invert max-w-none font-serif
                      prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
                      prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:lg:text-6xl prose-h1:mt-12 prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                      prose-h2:text-3xl prose-h2:md:text-4xl prose-h2:lg:text-5xl prose-h2:mt-12 prose-h2:mb-7 prose-h2:text-gray-900 dark:prose-h2:text-gray-50
                      prose-h3:text-2xl prose-h3:md:text-3xl prose-h3:mt-10 prose-h3:mb-6 prose-h3:text-gray-800 dark:prose-h3:text-gray-100
                      prose-h4:text-xl prose-h4:md:text-2xl prose-h4:mt-8 prose-h4:mb-4
                      prose-p:text-lg prose-p:md:text-xl prose-p:leading-normal prose-p:md:leading-[1.6] prose-p:my-4 prose-p:md:my-5 prose-p:text-gray-800 dark:prose-p:text-gray-200
                      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
                      prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-white
                      prose-em:italic prose-em:text-gray-800 dark:prose-em:text-gray-200
                      prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400
                      prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10
                      prose-blockquote:pl-8 prose-blockquote:pr-6 prose-blockquote:py-4 prose-blockquote:my-8
                      prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-xl prose-blockquote:md:text-2xl prose-blockquote:font-serif
                      prose-ul:my-6 prose-ul:space-y-1.5 prose-ol:my-6 prose-ol:space-y-1.5 prose-ul:font-serif prose-ol:font-serif
                      prose-li:leading-snug prose-li:text-lg prose-li:md:text-xl prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-li:pl-2
                      prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-10 prose-img:border-2 prose-img:border-gray-200 dark:prose-img:border-gray-700
                      prose-pre:bg-gray-900 dark:prose-pre:bg-black prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-gray-700
                      prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:font-mono prose-code:text-base
                      prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
                      prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent
                      prose-pre-code:bg-transparent prose-pre-code:p-4 prose-pre-code:block prose-pre-code:overflow-x-auto
                      prose-hr:my-16 prose-hr:border-2 prose-hr:border-gray-200 dark:prose-hr:border-gray-700
                      prose-tbody:nth-child-even:bg-gray-50/50 dark:prose-tbody:nth-child-even:bg-gray-900/50
                      prose-tbody-tr:hover:bg-blue-50/50 dark:prose-tbody-tr:hover:bg-blue-950/30
                      [&_pre_code]:text-gray-100 [&_pre_code]:font-mono [&_pre_code]:text-sm">
                      {post.content && <MDXContent content={post.content} />}
                    </div>
                  </div>
                </div>

              {/* Tags */}
              {(post.tags || []).length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags:</span>
                    {(post.tags || []).map((tag) => (
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
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">← Previous Post</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {prevPost.title}
                      </div>
                    </Link>
                  )}
                  {nextPost && (
                    <Link
                      href={`/blog/${nextPost.slug}`}
                      className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900 md:text-right"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Next Post →</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {nextPost.title}
                      </div>
                    </Link>
                  )}
                </div>
              )}

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
                        <Image
                          src={url}
                          alt={`Gallery image ${idx + 1}`}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Related Links & Backlinks */}
              {post.relatedLinks && post.relatedLinks.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                    Related Links
                  </h2>
                  <div className="space-y-4">
                    {post.relatedLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : undefined}
                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="group block p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 flex items-center gap-2">
                          {link.title}
                          {link.url.startsWith('http') && (
                            <span className="text-xs text-gray-400">↗</span>
                          )}
                        </h3>
                        {link.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {link.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {link.url}
                        </p>
                      </Link>
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

            {/* Sidebar */}
            <aside className="hidden lg:block space-y-6">
              {/* Quick Links - Auto-detected content elements */}
              {post.content && <ContentQuickLinks content={post.content} />}

              {/* Table of Contents - Only show if explicitly enabled */}
              {post.content && !hasInlineTOC && (post.sidebarWidgets?.showTableOfContents === true) && (
                <TableOfContents content={post.content} />
              )}

              {/* Wired News */}
              {(post.sidebarWidgets?.showRelatedNews !== false) && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Wired News
                  </h3>
                  <NewsFeed keywords={newsKeywords} limit={3} />
                </div>
              )}

              {/* Gallery Widget */}
              {(post.sidebarWidgets?.showGallery !== false) && post.galleryImages && post.galleryImages.length > 0 && (
                <SidebarGallery images={post.galleryImages} />
              )}

              {/* Weather Widget */}
              {(post.sidebarWidgets?.showWeather !== false) && <SidebarWeather />}

              {/* Clock Widget */}
              <SidebarClock />

              {/* Contact Widget */}
              {(post.sidebarWidgets?.showContact !== false) && <SidebarContact />}

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
        </div>

        {/* Mobile Widget Bar */}
        <BlogPostMobileWidget
          postContent={post.content}
          galleryImages={post.galleryImages || []}
          newsKeywords={newsKeywords}
          showQuickLinks={post.sidebarWidgets?.showRelatedNews !== false}
          showTableOfContents={!hasInlineTOC && (post.sidebarWidgets?.showTableOfContents === true)}
          showRelatedNews={post.sidebarWidgets?.showRelatedNews !== false}
          showGallery={(post.sidebarWidgets?.showGallery !== false) && post.galleryImages && post.galleryImages.length > 0}
          showWeather={post.sidebarWidgets?.showWeather !== false}
          showContact={post.sidebarWidgets?.showContact !== false}
          sidebarMusicPlayer={post.sidebarMusicPlayer}
        />

        {/* Back to Top Button */}
        <BackToTop />

        {/* Sticky Music Player */}
        <StickyMusicPlayer musicPlayer={post.sidebarMusicPlayer || null} />
      </main>
    </>
  );
}
