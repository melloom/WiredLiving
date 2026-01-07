'use client';

import { useState, useEffect } from 'react';
import { isBookmarked, toggleBookmark, ReadingListItem } from '@/lib/reading-list';

interface BookmarkButtonProps {
  post: {
    slug: string;
    title: string;
    description?: string;
    coverImage?: string;
    date: string;
  };
  variant?: 'icon' | 'button';
}

export function BookmarkButton({ post, variant = 'icon' }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(post.slug));
  }, [post.slug]);

  const handleClick = () => {
    const item: Omit<ReadingListItem, 'addedAt'> = {
      slug: post.slug,
      title: post.title,
      description: post.description,
      coverImage: post.coverImage,
      date: post.date,
    };
    
    const newState = toggleBookmark(item);
    setBookmarked(newState);
    setAnimating(true);
    
    setTimeout(() => setAnimating(false), 600);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          bookmarked
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-transform ${animating ? 'scale-125' : ''}`}
          fill={bookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {bookmarked ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg transition-all ${
        bookmarked
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={bookmarked ? 'Remove from reading list' : 'Add to reading list'}
    >
      <svg
        className={`w-5 h-5 transition-transform ${animating ? 'scale-125' : ''}`}
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}

