'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogFiltersProps {
  tags: string[];
  selectedTag?: string;
}

export function BlogFilters({ tags, selectedTag }: BlogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const router = useRouter();

  const handleTagClick = (tag: string | null) => {
    if (tag === null) {
      router.push('/blog');
    } else {
      router.push(`/blog/tag/${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Filter by Tag
            </h3>
            {tags.length > 12 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {showAllTags ? 'Show Less' : `Show All (${tags.length})`}
              </button>
            )}
          </div>
          <div className={`flex flex-wrap gap-2 ${!showAllTags && tags.length > 12 ? 'max-h-32 overflow-hidden relative' : ''}`}>
            <button
              onClick={() => handleTagClick(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !selectedTag
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {(showAllTags ? tags : tags.slice(0, 11)).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
            {!showAllTags && tags.length > 12 && (
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


