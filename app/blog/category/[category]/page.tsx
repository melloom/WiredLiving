import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostsByCategory, getAllCategories } from '@/lib/supabase-db';
import { formatDate } from '@/lib/utils';
import { PostCard } from '@/components/post-card';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({
    category: encodeURIComponent(category),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> | { category: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const category = decodeURIComponent(resolvedParams.category);
  const posts = await getPostsByCategory(category);

  if (posts.length === 0) {
    return {
      title: 'Category Not Found',
      description: `The category "${category}" could not be found`,
    };
  }

  return {
    title: `${category} | ${siteConfig.name}`,
    description: `Browse all posts in the ${category} category on ${siteConfig.name}`,
    keywords: [category, 'blog', 'category'],
    openGraph: {
      title: `${category} | ${siteConfig.name}`,
      description: `Browse all posts in the ${category} category`,
      ...(siteConfig.url && { url: `${siteConfig.url}/blog/category/${encodeURIComponent(category)}` }),
      siteName: siteConfig.name,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> | { category: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const category = decodeURIComponent(resolvedParams.category);
  const posts = await getPostsByCategory(category);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">Category</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{category}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              {category}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

