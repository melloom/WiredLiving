import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getAllCategories } from '@/lib/supabase-db';
import { PostCard } from '@/components/post-card';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> | { category: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const decodedCategory = decodeURIComponent(resolvedParams.category);
  const posts = await getAllPosts();
  const categoryPosts = posts.filter(post => post.category === decodedCategory);

  if (categoryPosts.length === 0) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${decodedCategory} | ${siteConfig.name}`,
    description: `Browse all posts in the ${decodedCategory} category on ${siteConfig.name}. ${categoryPosts.length} ${categoryPosts.length === 1 ? 'article' : 'articles'} available.`,
    keywords: [decodedCategory, 'Category', 'Blog Category', siteConfig.name],
    openGraph: {
      title: `${decodedCategory} | ${siteConfig.name}`,
      description: `Browse all posts in the ${decodedCategory} category on ${siteConfig.name}`,
      ...(siteConfig.url && { url: `${siteConfig.url}/blog/category/${resolvedParams.category}` }),
      siteName: siteConfig.name,
      type: 'website',
      images: [
        {
          url: siteConfig.ogImage || '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${decodedCategory} category - ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decodedCategory} | ${siteConfig.name}`,
      description: `Browse all posts in the ${decodedCategory} category`,
      images: [siteConfig.ogImage || '/og-image.jpg'],
      ...(siteConfig.author.twitter && { creator: `@${siteConfig.author.twitter}` }),
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(siteConfig.url && {
      alternates: {
        canonical: `${siteConfig.url}/blog/category/${resolvedParams.category}`,
      },
    }),
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> | { category: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const decodedCategory = decodeURIComponent(resolvedParams.category);
  const posts = await getAllPosts();
  const categories = await getAllCategories();
  
  const categoryPosts = posts
    .filter(post => post.category === decodedCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!categories.includes(decodedCategory)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400">Categories</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-gray-100">{decodedCategory}</span>
            </nav>
            
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {categoryPosts.length} {categoryPosts.length === 1 ? 'Post' : 'Posts'}
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              {decodedCategory}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              All posts in the {decodedCategory} category
            </p>
          </div>

          {/* Posts Grid */}
          {categoryPosts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-lg text-center">
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                No posts in this category yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Check back later for posts in this category
              </p>
              <Link
                href="/blog"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Browse All Posts
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
