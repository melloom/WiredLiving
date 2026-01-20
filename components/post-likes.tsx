'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PostLikesProps {
  postSlug: string;
  initialLikesCount?: number;
}

export function PostLikes({ postSlug, initialLikesCount = 0 }: PostLikesProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Get user identifier (using localStorage for anonymous users)
  const getUserIdentifier = (): string => {
    if (typeof window === 'undefined') return '';
    
    let identifier = localStorage.getItem('user_identifier');
    if (!identifier) {
      identifier = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_identifier', identifier);
    }
    return identifier;
  };

  // Fetch initial likes state
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const userIdentifier = getUserIdentifier();
        const response = await fetch(`/api/posts/${postSlug}/like?userIdentifier=${encodeURIComponent(userIdentifier)}`);
        if (response.ok) {
          const data = await response.json();
          setLikesCount(data.likesCount || 0);
          setIsLiked(data.hasLiked || false);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchLikes();
  }, [postSlug]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const userIdentifier = getUserIdentifier();
      const response = await fetch(`/api/posts/${postSlug}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIdentifier,
          reactionType: 'like',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likesCount || 0);
        setIsLiked(data.isLiked || false);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all ${
        isLiked
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
    >
      <svg
        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isLiked ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"}
        />
      </svg>
      <span>{likesCount}</span>
    </button>
  );
}

