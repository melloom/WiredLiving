import { getAllPosts } from '@/lib/supabase-db';
import { PostCard } from './post-card';
import { NewsFeed } from './news-feed';

export async function FeaturedPosts() {
  const allPosts = await getAllPosts();
  
  // Sort posts by date (newest first) to ensure latest posts are shown
  const sortedPosts = [...allPosts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });
  
  const posts = sortedPosts.slice(0, 6);

  if (posts.length === 0) {
    return (
      <section id="latest-posts" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Posts</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    No posts yet. Go to the admin dashboard to create your first post!
                  </p>
                  <a
                    href="/admin"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    Create Your First Post
                  </a>
                </div>
              </div>
              <aside className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg sticky top-24">
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
          </div>
        </div>
      </section>
    );
  }

  // Get featured post (first featured post, or most recent if none are featured)
  const featuredPost = posts.find(p => p.featured && p.published) || posts[0];
  const otherPosts = posts.filter(p => p.slug !== featuredPost?.slug).slice(0, 5);

  return (
    <section id="latest-posts" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Posts</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the latest articles, tutorials, and insights
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 lg:col-span-2">
                  <PostCard post={featuredPost} featured />
                </div>
                {otherPosts.slice(0, 1).map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
                {otherPosts.slice(1).map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>

              <div className="text-center">
                <a
                  href="/blog"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  View All Posts
                </a>
              </div>
            </div>

            {/* Sidebar with News Feed */}
            <aside className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg sticky top-24">
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
        </div>
      </div>
    </section>
  );
}

