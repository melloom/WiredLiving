import { PostCard } from './post-card';
import { LatestPostsCarousel } from './latest-posts-carousel';
import type { BlogPost } from '@/types';

type FeaturedPostsProps = {
  posts: BlogPost[];
  allPosts?: BlogPost[];
};

export function FeaturedPosts({ posts, allPosts = [] }: FeaturedPostsProps) {
  // Only show up to 3 featured posts
  const featuredPosts = posts && posts.length > 0 ? posts.slice(0, 3) : [];
  
  // Get remaining posts (excluding the featured ones) - show last 7 posts
  const featuredSlugs = new Set(featuredPosts.map(p => p.slug));
  const morePosts = allPosts
    .filter(p => !featuredSlugs.has(p.slug))
    .slice(0, 7); // Limit to 7 latest posts
  
  // Determine grid layout based on number of featured posts
  const getGridClass = () => {
    if (featuredPosts.length === 1) {
      return 'grid grid-cols-1 max-w-2xl mx-auto'; // Center single post
    } else if (featuredPosts.length === 2) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-6'; // 2 columns for 2 posts
    } else {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'; // 3 columns for 3 posts
    }
  };
  
  return (
    <section className="mb-20 px-4" aria-labelledby="featured-posts-heading" itemScope itemType="https://schema.org/Blog">
      <div className="max-w-7xl mx-auto">
        {featuredPosts.length > 0 && (
          <>
            <header className="text-center mb-12">
              <div className="space-y-4">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full" itemProp="about">
                  Featured
                </span>
                <h1 id="featured-posts-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white" itemProp="headline">
                  Featured Posts
                </h1>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto" itemProp="description">
                  Explore articles, tutorials, and insights on technology, development, and innovation.
                </p>
              </div>
            </header>
            
            <div className={`${getGridClass()} mb-16`}>
              {featuredPosts.map((post) => (
                <PostCard key={post.slug} post={post} featured />
              ))}
            </div>
          </>
        )}
      
      {morePosts.length > 0 && (
        <LatestPostsCarousel posts={morePosts} />
      )}
      
      {allPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No posts available yet.</p>
        </div>
      )}
      </div>
    </section>
  );
}

