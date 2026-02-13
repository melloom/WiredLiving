'use client';

// Generate a unique visitor ID and store it in localStorage
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'blog_visitor_id';
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    // Generate a unique ID
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
}

// Generate a session ID (resets on page reload)
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'blog_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

// Track a page view
export async function trackPageView(data: {
  pagePath: string;
  pageTitle?: string;
  postSlug?: string;
  referrer?: string;
}) {
  if (typeof window === 'undefined') return;
  
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    
    const payload = {
      ...data,
      sessionId,
      visitorId,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      referrer: data.referrer || document.referrer,
    };

    // Send tracking request (fire and forget)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      // Silently fail - don't interrupt user experience
      console.debug('Analytics tracking failed:', error);
    });
  } catch (error) {
    // Silently fail
    console.debug('Analytics tracking error:', error);
  }
}

