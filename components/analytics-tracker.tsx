'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

interface AnalyticsTrackerProps {
  postSlug?: string;
  pageTitle?: string;
}

export function AnalyticsTracker({ postSlug, pageTitle }: AnalyticsTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view when component mounts
    trackPageView({
      pagePath: pathname,
      pageTitle: pageTitle || document.title,
      postSlug: postSlug,
    });
  }, [pathname, postSlug, pageTitle]);

  return null; // This component doesn't render anything
}

