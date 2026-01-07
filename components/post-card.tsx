import Link from 'next/link';
import { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block h-full p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900"
    >
      <div className="flex flex-col h-full">
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
        
        {post.tags.length > 0 && (
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

