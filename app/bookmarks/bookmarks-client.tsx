'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface BookmarkedPost {
  slug: string;
  title: string;
  description?: string;
  date: string;
  category?: string;
  coverImage?: string;
  readingTime?: number;
}

export function BookmarksClient() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      
      if (saved.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch posts data for bookmarked slugs
        const response = await fetch('/api/posts/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: saved }),
        });

        if (response.ok) {
          const posts = await response.json();
          setBookmarkedPosts(posts);
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();

    // Listen for bookmark changes
    const handleBookmarkChange = () => loadBookmarks();
    window.addEventListener('bookmarkChanged', handleBookmarkChange);
    window.addEventListener('storage', handleBookmarkChange);

    return () => {
      window.removeEventListener('bookmarkChanged', handleBookmarkChange);
      window.removeEventListener('storage', handleBookmarkChange);
    };
  }, []);

  const removeBookmark = (slug: string) => {
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    localStorage.setItem('savedPosts', JSON.stringify(saved.filter((s: string) => s !== slug)));
    setBookmarkedPosts(bookmarkedPosts.filter(post => post.slug !== slug));
    window.dispatchEvent(new Event('bookmarkChanged'));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      localStorage.setItem('savedPosts', '[]');
      setBookmarkedPosts([]);
      window.dispatchEvent(new Event('bookmarkChanged'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookmarks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                My Bookmarks
              </h1>
              {bookmarkedPosts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {bookmarkedPosts.length === 0
                ? "You haven't bookmarked any articles yet."
                : `${bookmarkedPosts.length} ${bookmarkedPosts.length === 1 ? 'article' : 'articles'} saved for later`}
            </p>
          </div>

          {/* Empty State */}
          {bookmarkedPosts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No bookmarks yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start bookmarking articles to build your reading list
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse Articles
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            /* Bookmarked Posts List */
            <div className="space-y-4">
              {bookmarkedPosts.map((post) => (
                <div
                  key={post.slug}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    {post.coverImage && (
                      <Link href={`/blog/${post.slug}`} className="flex-shrink-0 hidden sm:block">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-transform"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link href={`/blog/${post.slug}`}>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                        </Link>
                        <button
                          onClick={() => removeBookmark(post.slug)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Remove bookmark"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {post.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(post.date)}
                        </span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {post.category}
                            </span>
                          </>
                        )}
                        {post.readingTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {post.readingTime} min read
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
