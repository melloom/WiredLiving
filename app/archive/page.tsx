import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Archive | ${siteConfig.name}`,
  description: `Browse all blog posts organized by date on ${siteConfig.name}. Explore our content archive sorted by year and month.`,
  keywords: ['Archive', 'Posts Archive', 'Blog Archive', 'Content Archive', siteConfig.name],
  openGraph: {
    title: `Archive | ${siteConfig.name}`,
    description: `Browse all blog posts organized by date on ${siteConfig.name}`,
    ...(siteConfig.url && { url: `${siteConfig.url}/archive` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Archive - ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Archive | ${siteConfig.name}`,
    description: `Browse all blog posts organized by date on ${siteConfig.name}`,
    images: [siteConfig.ogImage],
    ...(siteConfig.author.twitter && { creator: `@${siteConfig.author.twitter}` }),
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/archive`,
    },
  }),
};

export default async function ArchivePage() {
  const allPosts = await getAllPosts();
  
  // Sort posts by date (newest first) to ensure latest posts are shown
  const posts = [...allPosts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });
  
  // Group posts by year and month
  const postsByDate = posts.reduce((acc, post) => {
    const date = new Date(post.date);
    const year = date.getFullYear();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const key = `${year}-${month}`;
    
    if (!acc[key]) {
      acc[key] = {
        year,
        month,
        posts: [],
      };
    }
    acc[key].posts.push(post);
    return acc;
  }, {} as Record<string, { year: number; month: string; posts: typeof posts }>);

  const sortedDates = Object.values(postsByDate).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return new Date(`${b.month} 1, ${b.year}`).getTime() - new Date(`${a.month} 1, ${a.year}`).getTime();
  });

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Archive</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Browse all posts organized by date
          </p>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Check back soon for archived content!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedDates.map(({ year, month, posts: monthPosts }) => (
                <section key={`${year}-${month}`} className="border-b border-gray-200 dark:border-gray-800 pb-8 last:border-0">
                  <h2 className="text-2xl font-semibold mb-4">
                    {month} {year}
                  </h2>
                  <div className="space-y-4">
                    {monthPosts.map((post) => (
                      <article key={post.slug} className="flex items-start gap-4">
                        <time 
                          dateTime={post.date}
                          className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[100px]"
                        >
                          {formatDate(post.date)}
                        </time>
                        {post.coverImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-24 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <Link 
                            href={`/blog/${post.slug}`}
                            className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {post.title}
                          </Link>
                          {post.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {post.description}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


