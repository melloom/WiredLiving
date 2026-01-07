'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
}

export function NewsFeed({ initialArticles = [] }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [loading, setLoading] = useState(!initialArticles.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialArticles.length === 0) {
      fetch('/api/news')
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
  }, [initialArticles.length]);

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
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
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
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
                  <span className="truncate max-w-[100px]">{article.source.name}</span>
                  {article.publishedAt && (
                    <>
                      <span>•</span>
                      <span className="whitespace-nowrap">{formatDate(article.publishedAt)}</span>
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

