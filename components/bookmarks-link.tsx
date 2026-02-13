'use client';

import { useState, useEffect, type MouseEventHandler } from 'react';
import Link from 'next/link';

interface BookmarksLinkProps {
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function BookmarksLink({ className, onClick }: BookmarksLinkProps) {
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    // Check bookmarks on mount
    const updateBookmarkCount = () => {
      const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      setBookmarkCount(saved.length);
    };

    updateBookmarkCount();

    // Listen for storage changes (when bookmarks are added/removed)
    window.addEventListener('storage', updateBookmarkCount);
    
    // Custom event for same-page bookmark changes
    window.addEventListener('bookmarkChanged', updateBookmarkCount);

    return () => {
      window.removeEventListener('storage', updateBookmarkCount);
      window.removeEventListener('bookmarkChanged', updateBookmarkCount);
    };
  }, []);

  // Don't show if no bookmarks
  if (bookmarkCount === 0) return null;

  return (
    <Link
      href="/bookmarks"
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${className || ''}`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <span>Bookmarks</span>
      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-full">
        {bookmarkCount}
      </span>
    </Link>
  );
}
