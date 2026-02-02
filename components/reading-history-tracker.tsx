'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ReadingHistoryTrackerProps {
  postSlug: string;
}

export function ReadingHistoryTracker({ postSlug }: ReadingHistoryTrackerProps) {
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastProgressRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollCheckRef = useRef(0);

  // Get user identifier
  const getUserIdentifier = (): string => {
    if (typeof window === 'undefined') return '';
    
    let identifier = localStorage.getItem('user_identifier');
    if (!identifier) {
      identifier = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_identifier', identifier);
      // Also set as cookie for server-side access
      document.cookie = `user_identifier=${identifier}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      // Ensure cookie is set even if localStorage already has it
      if (!document.cookie.includes('user_identifier=')) {
        document.cookie = `user_identifier=${identifier}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
    return identifier;
  };

  // Calculate reading progress
  const calculateProgress = (): number => {
    if (typeof window === 'undefined') return 0;

    const article = document.querySelector('article');
    if (!article) return 0;

    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    // Calculate how much of the article is visible
    const visibleStart = Math.max(0, scrollTop - articleTop);
    const visibleEnd = Math.min(articleHeight, scrollTop + windowHeight - articleTop);
    const visibleHeight = Math.max(0, visibleEnd - visibleStart);

    // Progress is based on how much has been scrolled past
    const scrolledPast = Math.max(0, scrollTop - articleTop);
    const progress = Math.min(100, Math.round((scrolledPast / articleHeight) * 100));

    return progress;
  };

  // Save reading history
  const saveProgress = useCallback(async (progress: number) => {
    if (progress === lastProgressRef.current) return; // Don't save if progress hasn't changed
    lastProgressRef.current = progress;

    try {
      const userIdentifier = getUserIdentifier();
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      await fetch(`/api/posts/${postSlug}/reading-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIdentifier,
          progressPercentage: progress,
          timeSpentSeconds: timeSpent,
        }),
      });
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  }, [postSlug]);

  useEffect(() => {
    // Track scroll progress with throttling
    const checkProgress = () => {
      const now = Date.now();
      // Only check every 1000ms to avoid excessive calculations
      if (now - lastScrollCheckRef.current < 1000) {
        return;
      }
      lastScrollCheckRef.current = now;
      
      const progress = calculateProgress();
      if (progress > 0 && progress % 10 === 0) {
        // Save every 10% progress
        saveProgress(progress);
      }
    };

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(checkProgress);
    };

    // Track time spent
    const startTracking = () => {
      trackingIntervalRef.current = setInterval(() => {
        const progress = calculateProgress();
        if (progress > 0) {
          saveProgress(progress);
        }
      }, 30000); // Save every 30 seconds
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    startTracking();

    // Save initial progress
    const initialProgress = calculateProgress();
    if (initialProgress > 0) {
      saveProgress(initialProgress);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      // Save final progress
      const finalProgress = calculateProgress();
      if (finalProgress > 0) {
        saveProgress(finalProgress);
      }
    };
  }, [postSlug, saveProgress]);

  // This component doesn't render anything
  return null;
}

