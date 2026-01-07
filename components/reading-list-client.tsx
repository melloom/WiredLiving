'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReadingList, removeFromReadingList, clearReadingList, ReadingListItem } from '@/lib/reading-list';

export function ReadingListClient() {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(getReadingList());
    setLoading(false);
  }, []);

  const handleRemove = (slug: string) => {
    if (removeFromReadingList(slug)) {
      setItems(getReadingList());
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your entire reading list?')) {
      clearReadingList();
      setItems([]);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {items.length} {items.length === 1 ? 'Post' : 'Posts'} Saved
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Reading List
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your saved posts and bookmarked articles
            </p>
          </div>

          {/* Actions */}
          {items.length > 0 && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Reading List */}
          {items.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-lg text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Your reading list is empty
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start saving posts by clicking the bookmark icon on any post
              </p>
              <Link
                href="/blog"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Browse Posts
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {items.map((item) => (
                <div
                  key={item.slug}
                  className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      {item.coverImage && (
                        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <Link href={`/blog/${item.slug}`}>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </h2>
                          </Link>
                          <button
                            onClick={() => handleRemove(item.slug)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                            title="Remove from reading list"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Saved {new Date(item.addedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <Link
                            href={`/blog/${item.slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Read Post →
                          </Link>
                        </div>
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

