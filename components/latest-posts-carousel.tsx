'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './post-card';
import type { BlogPost } from '@/types';

type LatestPostsCarouselProps = {
  posts: BlogPost[];
};

export function LatestPostsCarousel({ posts }: LatestPostsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, posts.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
    setIsAutoPlaying(false);
  };

  if (posts.length === 0) return null;

  // Show 3 posts at a time on desktop, 1 on mobile
  const getVisiblePosts = () => {
    const visiblePosts = [];
    const postsToShow = Math.min(3, posts.length); // Don't show more than available
    for (let i = 0; i < postsToShow; i++) {
      const index = (currentIndex + i) % posts.length;
      visiblePosts.push(posts[index]);
    }
    return visiblePosts;
  };

  const visiblePosts = getVisiblePosts();

  return (
    <section aria-labelledby="latest-posts-heading" id="latest-posts">
      <div className="flex items-center justify-between mb-8">
        <h2 id="latest-posts-heading" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Latest Posts
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Previous posts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Next posts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel container */}
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-500">
          {visiblePosts.map((post) => (
            <div key={post.slug} className="animate-fadeIn">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {posts.length > 3 && (
        <div className="flex justify-center gap-2 mt-8">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-8'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-play indicator */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          {isAutoPlaying ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause auto-rotation
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume auto-rotation
            </>
          )}
        </button>
      </div>
    </section>
  );
}
