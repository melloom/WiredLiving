import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getPostBySlugAny } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { MDXContent } from '@/components/mdx-content';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  // Handle both sync and async params (Next.js 14+)
  const resolvedParams = await Promise.resolve(params);
  // Decode the slug in case it's URL-encoded
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const post = await getPostBySlugAny(decodedSlug);

  if (!post) {
    return {
      title: 'Preview Not Available',
      description: 'This preview could not be loaded.',
    };
  }

  const title = post.seoTitle || `${post.title} (Preview)`;
  const description = post.seoDescription || post.description || 'Draft preview of a WiredLiving post.';
  const ogImage = post.ogImageOverride || post.coverImage || siteConfig.ogImage || '/og-image.jpg';
  const url = siteConfig.url ? `${siteConfig.url}/blog/${decodedSlug}?preview=1` : undefined;

  return {
    title,
    description,
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
    ...(url && {
      alternates: {
        canonical: url,
      },
    }),
  };
}

export default async function BlogPostPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const session = await auth();

  // Handle both sync and async params (Next.js 14+)
  const resolvedParams = await Promise.resolve(params);

  if (!session) {
    return redirect(`/login?callbackUrl=/blog/preview/${encodeURIComponent(resolvedParams.slug)}`);
  }

  // Decode the slug in case it's URL-encoded
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  console.log('Preview page - looking for slug:', decodedSlug);

  const post = await getPostBySlugAny(decodedSlug);

  if (!post) {
    console.error('Post not found for slug:', decodedSlug);
    console.log('Available posts in database - checking...');
    notFound();
  }

  console.log('Post found:', { slug: post.slug, title: post.title, status: post.status });

  // Build structured data schema
  const articleUrl = siteConfig.url ? `${siteConfig.url}/blog/${post.slug}` : undefined;
  const schemaType = post.structuredDataType || 'BlogPosting';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
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
    keywords: post.tags?.join(', ') || '',
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="border-b border-amber-200/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
              !
            </span>
            <div className="flex flex-col">
              <span className="font-semibold uppercase tracking-wide">Preview mode</span>
              <span className="text-[11px]">
                Only visible to you while logged in. This post is{' '}
                {post.published ? 'currently live' : 'not published yet'}.
              </span>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-medium"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section - Full Width */}
        <header className="space-y-6 mb-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            {/* Category, Featured, and Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
              <span className="px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700">
                🔍 PREVIEW MODE
              </span>
              {post.featured && (
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 text-yellow-900 font-bold shadow-lg flex items-center gap-2 animate-pulse">
                  <span className="text-lg">⭐</span>
                  <span>Featured</span>
                </span>
              )}
              {post.category && (
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                  {post.category}
                </span>
              )}
              {post.series && (
                <Link
                  href={`/series/${encodeURIComponent(post.series)}`}
                  className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  Series: {post.series}
                  {post.seriesOrder && ` #${post.seriesOrder}`}
                </Link>
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
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed italic border-l-4 border-blue-400 pl-4 mt-2">
                {post.description}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                  {post.author?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'MP'}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {post.author}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Published {formatDate(post.date)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mt-6 -mx-4 md:mx-0">
              <div className="w-full md:max-w-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover object-center"
                />
              </div>
            </div>
          )}
        </header>

        {/* Content Grid with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12">
          {/* Main article content */}
          <article className="min-w-0">
            <div className="bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg md:prose-xl lg:prose-2xl dark:prose-invert max-w-none font-serif
                  prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
                  prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:lg:text-6xl prose-h1:mt-12 prose-h1:mb-8
                  prose-h2:text-3xl prose-h2:md:text-4xl prose-h2:lg:text-5xl prose-h2:mt-12 prose-h2:mb-7
                  prose-h3:text-2xl prose-h3:md:text-3xl prose-h3:mt-10 prose-h3:mb-6
                  prose-p:text-lg prose-p:md:text-xl prose-p:leading-relaxed prose-p:md:leading-[1.75] prose-p:my-6 prose-p:md:my-7
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400
                  prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10 prose-blockquote:pl-8 prose-blockquote:py-4
                  prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-10
                  prose-code:text-pink-600 dark:prose-code:text-pink-400">
                  {post.content && <MDXContent content={post.content} />}
                </div>
              </div>
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
                      className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Preview Info Sidebar - NO STICKY */}
          <aside className="space-y-6 h-fit">
            {/* Visibility & Status Panel */}
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Visibility & Access
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-medium">
                    {post.status || (post.published ? 'published' : 'draft')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Visibility</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    {post.visibility || 'public'}
                  </span>
                </div>
                {post.isPremium && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Premium</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-[11px] font-medium text-yellow-700 dark:text-yellow-300">
                      ⭐ Premium
                    </span>
                  </div>
                )}
                {post.requiresLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Requires Login</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-[11px] font-medium text-purple-700 dark:text-purple-300">
                      🔒 Login Required
                    </span>
                  </div>
                )}
                {post.scheduledAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      {formatDate(typeof post.scheduledAt === 'string' ? post.scheduledAt : post.scheduledAt.toISOString())}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Panel */}
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                SEO Metadata
              </h3>
              <div className="space-y-3 text-xs">
                {post.seoTitle && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">SEO Title</span>
                    <p className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-words">
                      {post.seoTitle}
                    </p>
                  </div>
                )}
                {post.seoDescription && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">SEO Description</span>
                    <p className="text-[11px] bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-words">
                      {post.seoDescription}
                    </p>
                  </div>
                )}
                {post.twitterTitle && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">Twitter Title</span>
                    <p className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-words">
                      {post.twitterTitle}
                    </p>
                  </div>
                )}
                {post.twitterDescription && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">Twitter Description</span>
                    <p className="text-[11px] bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-words">
                      {post.twitterDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Schema & Structure Panel */}
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Schema & Structure
              </h3>
              <div className="space-y-3 text-xs">
                {post.structuredDataType && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Schema Type</span>
                    <span className="text-[11px] font-mono font-medium text-gray-700 dark:text-gray-300">
                      {post.structuredDataType}
                    </span>
                  </div>
                )}
                {post.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      {post.category}
                    </span>
                  </div>
                )}
                {post.series && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Series</span>
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        {post.series}
                        {post.seriesOrder && ` (#${post.seriesOrder})`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post Info Panel */}
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Post Info
              </h3>
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Reading time</span>
                  <span className="font-medium">
                    {post.readingTime ? `${post.readingTime} min` : '—'}
                  </span>
                </div>
                {post.wordCount && (
                  <div className="flex items-center justify-between">
                    <span>Word count</span>
                    <span className="font-medium">{post.wordCount.toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="block mb-1">Topics</span>
                  {(post.tags || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(post.tags || []).slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">No tags added</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}



