import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { PostCard } from '@/components/post-card';
import { BlogFilters } from '@/components/blog-filters';
import { NewsFeed } from '@/components/news-feed';

export const metadata: Metadata = {
  title: 'Blog - Articles & Stories | WiredLiving',
  description: 'Browse all articles, stories, and posts on WiredLiving. Explore life insights, personal reflections, and thoughts on the things that matter.',
  keywords: [
    'personal blog',
    'blog articles',
    'life stories',
    'personal posts',
    'lifestyle blog',
    'life insights',
    'blog posts',
    'WiredLiving blog',
  ],
  openGraph: {
    title: 'Blog - Articles & Stories | WiredLiving',
    description: 'Browse all articles, stories, and posts. Explore life insights, personal reflections, and thoughts.',

    ...(siteConfig.url && { url: `${siteConfig.url}/blog` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: '/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog Page',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Articles & Stories | WiredLiving',
    description: 'Browse articles, stories, and posts on life, ideas, and everything in between.',

    images: [siteConfig.ogImage],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/blog`,
    },
  }),
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogPage() {
  const allPosts = await getAllPosts();
  const tags = await getAllTags();

  // Sort posts by date (newest first) to ensure latest posts are shown
  const posts = [...allPosts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });

  // Get featured post (first featured post, or most recent if none are featured)
  const featuredPost = posts.find(p => p.featured) || posts[0];
  const otherPosts = posts.filter(p => p.slug !== featuredPost?.slug);

  // Create structured data
  const blogPageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Blog | ${siteConfig.name}`,
    description: `Browse all blog posts, articles, and tutorials on ${siteConfig.name}`,
    ...(siteConfig.url && { url: `${siteConfig.url}/blog` }),
    blogPost: posts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      ...(siteConfig.url && { url: `${siteConfig.url}/blog/${post.slug}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPageSchema) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {posts.length} {posts.length === 1 ? 'Post' : 'Posts'} • {tags.length} {tags.length === 1 ? 'Tag' : 'Tags'}
                  </span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 pb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Blog
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Explore articles, tutorials, and insights on technology, development, and innovation
              </p>
            </div>

            {/* Featured Post */}
            {featuredPost && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Featured Post
                  </h2>
                </div>
                <PostCard post={featuredPost} featured variant="blog" />
              </section>
            )}

            {/* Filters and Posts Grid */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-8">
              {/* Posts Grid */}
              <div>
                {posts.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                      Coming Soon
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      We&apos;re working on great content for you. Check back soon!
                    </p>
                  </div>
                ) : (
                  <>
                    {otherPosts.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Latest Posts
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {otherPosts.length} {otherPosts.length === 1 ? 'post' : 'posts'} to explore
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {otherPosts.map((post) => (
                        <PostCard key={post.slug} post={post} />
                      ))}
                    </div>

                    {/* Empty state if no other posts */}
                    {otherPosts.length === 0 && featuredPost && (
                      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                        <p className="text-gray-600 dark:text-gray-400">
                          Check back soon for more posts!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sidebar with Filters */}
              <aside className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <BlogFilters tags={tags} />
                </div>

                {/* News Feed */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Tech News
                    </h3>
                  </div>
                  <NewsFeed />
                </div>
              </aside>
            </div>

            {/* Quick Links */}
            {tags.length > 0 && (
              <section className="mt-16">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Explore by Topic
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {tags.slice(0, 10).map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog/tag/${encodeURIComponent(tag)}`}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        {tag}
                      </Link>
                    ))}
                    {tags.length > 10 && (
                      <Link
                        href="/tags"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                      >
                        View All Tags →
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
