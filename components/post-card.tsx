import Link from 'next/link';
import { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
  variant?: 'home' | 'blog'; // Add variant prop
}

export function PostCard({ post, featured = false, variant = 'home' }: PostCardProps) {
  // Debug: Log cover image info
  if (typeof window !== 'undefined' && !post.coverImage) {
    console.log(`Post "${post.title}" has no cover image:`, post.coverImage);
  }

  if (featured) {
    // Blog page featured post - horizontal layout
    if (variant === 'blog') {
      return (
        <Link
          href={`/blog/${post.slug}`}
          className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-gray-900"
        >
          <div className="flex flex-col md:flex-row">
            {/* Cover image - side by side on desktop */}
            {post.coverImage && (
              <div className="md:w-2/5 h-64 md:h-auto flex-shrink-0 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  <img
                  src={post.coverImage}
                  alt={post.title + ' thumbnail'}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  style={{
                    objectPosition: post.coverImageCrop?.objectPosition || 'center',
                    ...(post.coverImageCrop?.zoom && post.coverImageCrop.zoom !== 1 ? { transform: `scale(${post.coverImageCrop.zoom})` } : {})
                  }}
                  loading="lazy"
                />
                {/* Featured badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-bold">Featured</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-6 md:p-8 flex flex-col">
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h3>

              {/* Description */}
              <p className="text-base text-gray-600 dark:text-gray-400 mb-4 leading-relaxed line-clamp-3">
                {post.description}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="font-medium">{formatDate(post.date)}</span>
                {post.readingTime && (
                  <>
                    <span>•</span>
                    <span className="font-medium">{post.readingTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      );
    }

    // Home page featured post - compact vertical layout
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-gray-900 relative"
      >
        <div className="relative h-full flex flex-col">
          {/* Featured badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold">Featured</span>
            </div>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative h-40 md:h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                  src={post.coverImage}
                  alt={post.title + ' thumbnail'}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  style={{
                    objectPosition: post.coverImageCrop?.objectPosition || 'center',
                    ...(post.coverImageCrop?.zoom && post.coverImageCrop.zoom !== 1 ? { transform: `scale(${post.coverImageCrop.zoom})` } : {})
                  }}
                  loading="lazy"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          )}

          <div className="p-5 flex flex-col flex-grow">
            {/* Title */}
            <h3 className="text-lg md:text-xl font-bold mb-2 leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {post.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed line-clamp-2">
              {post.description}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
              <span>{formatDate(post.date)}</span>
              {post.readingTime && (
                <>
                  <span>•</span>
                  <span>{post.readingTime} min</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }
  // ...existing code for non-featured
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block h-full p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900"
    >
      <div className="flex flex-col h-full">
        {/* Thumbnail image if present */}
        {post.coverImage && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title + ' thumbnail'}
              className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-500"
              style={{
                objectPosition: post.coverImageCrop?.objectPosition || 'center',
                ...(post.coverImageCrop?.zoom && post.coverImageCrop.zoom !== 1 ? { transform: `scale(${post.coverImageCrop.zoom})` } : {})
              }}
              loading="lazy"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(post.date)}
          </span>
          {post.readingTime && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {post.readingTime} min read
              </span>
            </>
          )}
        </div>
        <h3
          className={`font-semibold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
            featured ? 'text-2xl' : 'text-xl'
          }`}
        >
          {post.title}
        </h3>
        <p
          className={`text-gray-600 dark:text-gray-400 mb-4 flex-grow ${
            featured ? 'text-base' : 'text-sm'
          }`}
        >
          {post.description}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
          Read more →
        </div>
      </div>
    </Link>
  );
}

