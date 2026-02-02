'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Tag {
  name: string;
  count: number;
}

interface TagCloudProps {
  tags: Tag[];
}

export function TagCloud({ tags }: TagCloudProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate size classes based on count
  const getSizeClass = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return 'text-3xl font-bold';
    if (ratio >= 0.4) return 'text-2xl font-semibold';
    if (ratio >= 0.2) return 'text-xl font-medium';
    return 'text-lg';
  };

  // Get color gradient based on count
  const getColorClass = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return 'from-blue-600 to-purple-600';
    if (ratio >= 0.4) return 'from-blue-500 to-purple-500';
    if (ratio >= 0.2) return 'from-blue-400 to-purple-400';
    return 'from-gray-600 to-gray-500';
  };

  const maxCount = Math.max(...tags.map(t => t.count), 1);
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tags..."
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

      {/* Tag Cloud */}
      {filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No tags found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-center justify-center py-6">
          {filteredTags.map((tag) => {
            const sizeClass = getSizeClass(tag.count, maxCount);
            const colorClass = getColorClass(tag.count, maxCount);
            
            return (
              <Link
                key={tag.name}
                href={`/blog/tag/${encodeURIComponent(tag.name)}`}
                className="group relative inline-block"
              >
                <span
                  className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${colorClass} text-white hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg ${sizeClass}`}
                >
                  {tag.name}
                  <span className="ml-2 text-sm opacity-90">
                    ({tag.count})
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


