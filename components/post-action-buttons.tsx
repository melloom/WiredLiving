'use client';

import { useEffect, useState } from 'react';

interface PostActionButtonsProps {
  postSlug: string;
}

export function PostActionButtons({ postSlug }: PostActionButtonsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Check if post is bookmarked on mount
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    setIsBookmarked(saved.includes(postSlug));
  }, [postSlug]);

  const handlePrint = () => {
    window.print();
  };

  const handleBookmark = () => {
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    const isSaved = saved.includes(postSlug);
    
    if (isSaved) {
      localStorage.setItem('savedPosts', JSON.stringify(saved.filter((s: string) => s !== postSlug)));
      setIsBookmarked(false);
    } else {
      localStorage.setItem('savedPosts', JSON.stringify([...saved, postSlug]));
      setIsBookmarked(true);
    }
    
    // Dispatch custom event to update bookmark count in header
    window.dispatchEvent(new Event('bookmarkChanged'));
  };

  return (
    <>
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          title="Print article"
          aria-label="Print article"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            isBookmarked
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          title="Bookmark article"
          aria-label="Bookmark article"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {isBookmarked && (
            <span className="text-xs font-medium hidden sm:inline">Bookmarked</span>
          )}
        </button>
      </div>
    </>
  );
}
