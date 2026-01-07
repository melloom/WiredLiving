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
  const description = post.seoDescription || post.description || 'Draft preview of a Wiredliving post.';
  const ogImage = post.ogImageOverride || post.coverImage || siteConfig.ogImage || '/og-image.jpg';
  const url = siteConfig.url ? `${siteConfig.url}/blog/${params.slug}?preview=1` : undefined;

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

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)] gap-10 lg:gap-12">
          <article className="space-y-8">
            <header className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  {siteConfig.name} • {formatDate(post.date)} • Preview
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                  {post.title}
                </h1>
                {post.description && (
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                    {post.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {post.author}
                  </span>
                  <span>•</span>
                  <span>{formatDate(post.date)}</span>
                </span>
                {post.readingTime && (
                  <>
                    <span>•</span>
                    <span>{post.readingTime} min read</span>
                  </>
                )}
                {post.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {post.coverImage && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-[260px] md:h-[360px] object-cover"
                  />
                </div>
              )}
            </header>

            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-5 md:px-8 py-8 md:py-10 mb-8">
              <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24">
                {post.content && <MDXContent content={post.content} />}
              </div>
            </div>

            {/* Gallery section */}
            {post.galleryImages && post.galleryImages.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Visual extras
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

          {/* Preview Info Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
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
                      {formatDate(post.scheduledAt)}
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
                {post.ogImageOverride && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">OG Image Override</span>
                    <p className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-all">
                      {post.ogImageOverride}
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
                {post.canonicalUrl && (
                  <div>
                    <span className="block mb-1 text-gray-600 dark:text-gray-400">Canonical URL</span>
                    <p className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 break-all">
                      {post.canonicalUrl}
                    </p>
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
                  {post.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 6).map((tag) => (
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



