import { getAllPosts } from '@/lib/mdx';
import { PostCard } from './post-card';

export function FeaturedPosts() {
  const posts = getAllPosts().slice(0, 6);

  if (posts.length === 0) {
    return (
      <section id="latest-posts" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Posts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              No posts yet. Create your first post in the content/posts directory!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add a .mdx file with frontmatter to get started.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <section id="latest-posts" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Posts</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the latest articles, tutorials, and insights
            </p>
          </div>

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
      </div>
    </section>
  );
}

