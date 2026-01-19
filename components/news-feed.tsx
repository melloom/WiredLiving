'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsFeedProps {
  initialArticles?: NewsArticle[];
  keywords?: string;
  limit?: number;
}

export function NewsFeed({ initialArticles = [], keywords, limit = 3 }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [loading, setLoading] = useState(!initialArticles.length);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialArticles.length === 0) {
      const params = new URLSearchParams();
      if (keywords) {
        params.append('keywords', keywords);
      }
      params.append('limit', limit.toString());
      
      fetch(`/api/news?${params.toString()}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else if (data.articles && data.articles.length > 0) {
            setArticles(data.articles);
          } else {
            setError('No articles returned from API');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('News fetch error:', err);
          setError(`Failed to load news: ${err.message}`);
          setLoading(false);
        });
    }
  }, [initialArticles.length, keywords, limit]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const hasValidImage = (article: NewsArticle, index: number) => {
    return article.urlToImage && !imageErrors.has(index) && article.urlToImage.startsWith('http');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || articles.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error === 'NEWS_API_KEY not configured'
            ? 'News feed not configured'
            : error || 'No news available'}
        </p>
        {error === 'NEWS_API_KEY not configured' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Add NEWS_API_KEY to your environment variables
          </p>
        )}
        {error && error !== 'NEWS_API_KEY not configured' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Check console for details or verify your API key
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, index) => (
        <Link
          key={index}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all overflow-hidden">
            <div className="flex items-start gap-3">
              {hasValidImage(article, index) ? (
                <div className="w-16 h-16 flex-shrink-0 relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <Image
                    src={article.urlToImage!}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => handleImageError(index)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-1 transition-colors break-words">
                  {article.title}
                </h4>
                {article.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 break-words overflow-hidden">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                  <span className="max-w-[120px] truncate" title={article.source.name}>{article.source.name}</span>
                  {article.publishedAt && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="whitespace-nowrap" title={new Date(article.publishedAt).toLocaleString()}>{formatDate(article.publishedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="https://newsapi.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          Powered by Event Registry
        </Link>
      </div>
    </div>
  );
}

