'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types';

interface SearchPageClientProps {
  posts: BlogPost[];
}

export function SearchPageClient({ posts }: SearchPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(post => {
      (post.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  // Filter posts based on search query and tag
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by tag if selected
    if (selectedTag) {
      filtered = filtered.filter(post => (post.tags || []).includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const descriptionMatch = post.description?.toLowerCase().includes(query);
        const contentMatch = post.content?.toLowerCase().includes(query);
        const tagMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(query));
        const authorMatch = post.author.toLowerCase().includes(query);
        
        return titleMatch || descriptionMatch || contentMatch || tagMatch || authorMatch;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [posts, searchQuery, selectedTag]);

  // Generate autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestions: Array<{ type: 'title' | 'tag' | 'author'; text: string; slug?: string }> = [];
    
    // Title suggestions (max 5)
    const titleMatches = posts
      .filter(post => post.title.toLowerCase().includes(query))
      .slice(0, 5)
      .map(post => ({ type: 'title' as const, text: post.title, slug: post.slug }));
    suggestions.push(...titleMatches);
    
    // Tag suggestions (max 3)
    const allTags = new Set<string>();
    posts.forEach(post => (post.tags || []).forEach(tag => allTags.add(tag)));
    const tagMatches = Array.from(allTags)
      .filter(tag => tag.toLowerCase().includes(query))
      .slice(0, 3)
      .map(tag => ({ type: 'tag' as const, text: tag }));
    suggestions.push(...tagMatches);
    
    // Author suggestions (max 2)
    const allAuthors = new Set<string>();
    posts.forEach(post => allAuthors.add(post.author));
    const authorMatches = Array.from(allAuthors)
      .filter(author => author.toLowerCase().includes(query))
      .slice(0, 2)
      .map(author => ({ type: 'author' as const, text: author }));
    suggestions.push(...authorMatches);
    
    return suggestions.slice(0, 8); // Max 8 suggestions
  }, [searchQuery, posts]);

  // Track search analytics
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      // Track search query (debounced)
      const timeoutId = setTimeout(() => {
        fetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        }).catch(() => {}); // Fail silently
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: typeof autocompleteSuggestions[0]) => {
    if (suggestion.type === 'title' && suggestion.slug) {
      window.location.href = `/blog/${suggestion.slug}`;
    } else {
      setSearchQuery(suggestion.text);
      setShowAutocomplete(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {posts.length} Posts Available
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Search Posts
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Find articles by title, content, tags, or author
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative" ref={autocompleteRef}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search posts by title, content, tags, or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  if (autocompleteSuggestions.length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={() => {
                  setSearchFocused(false);
                  // Delay hiding to allow click on suggestions
                  setTimeout(() => setShowAutocomplete(false), 200);
                }}
                className="w-full px-6 py-4 pl-14 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg"
                autoFocus
              />
              <svg
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowAutocomplete(false);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl z-50 max-h-96 overflow-y-auto">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                      {suggestion.type === 'title' && (
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {suggestion.type === 'tag' && (
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      )}
                      {suggestion.type === 'author' && (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      <span className="text-gray-900 dark:text-gray-100 flex-1 truncate">{suggestion.text}</span>
                      {suggestion.type === 'title' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">View →</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Filter by Tag
                  </h3>
                  {allTags.length > 12 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {showAllTags ? 'Show Less' : `Show All (${allTags.length})`}
                    </button>
                  )}
                </div>
                <div className={`flex flex-wrap gap-2 ${!showAllTags && allTags.length > 12 ? 'max-h-32 overflow-hidden relative' : ''}`}>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedTag === null
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {(showAllTags ? allTags : allTags.slice(0, 11)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selectedTag === tag
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {!showAllTags && allTags.length > 12 && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredPosts.length === 0 ? (
                <span>No posts found</span>
              ) : (
                <span>
                  Found <strong className="text-gray-900 dark:text-gray-100">{filteredPosts.length}</strong>{' '}
                  {filteredPosts.length === 1 ? 'post' : 'posts'}
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedTag && ` in tag "${selectedTag}"`}
                </span>
              )}
            </p>
          </div>

          {/* Results */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-lg text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                No posts found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms or clearing filters'
                  : 'Try selecting a different tag'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      {post.coverImage && (
                        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {(post.tags || []).slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {(post.tags || []).length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{(post.tags || []).length - 3} more
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </h2>
                        {post.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{new Date(post.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                          <span>•</span>
                          <span>{post.author}</span>
                          {post.readingTime && (
                            <>
                              <span>•</span>
                              <span>{post.readingTime} min read</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

