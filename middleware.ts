import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (per runtime instance)
type RateInfo = {
  count: number;
  windowStart: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP per window
const rateLimitStore = new Map<string, RateInfo>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const info = rateLimitStore.get(key);

  if (!info) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - info.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  info.count += 1;
  rateLimitStore.set(key, info);

  return info.count > RATE_LIMIT_MAX_REQUESTS;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY');
  // MIME sniffing protection
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS protection (legacy header, still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Basic permissions policy (lock down powerful APIs)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Basic IP-based rate limiting for sensitive routes
  const ip =
    (req.ip as string | undefined) ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const isSensitiveApiRoute =
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/init-db');

  if (isSensitiveApiRoute) {
    const rateKey = `${ip}:${pathname}`;
    if (isRateLimited(rateKey)) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Too many requests. Please slow down.' },
          { status: 429 }
        )
      );
    }
  }

  // Protect admin page routes
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      // Redirect to login with callback URL
      const callbackUrl = encodeURIComponent(pathname);
      const res = NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
      );
      return addSecurityHeaders(res);
    }
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (!isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      );
    }
  }

  // Protect database init route
  if (pathname.startsWith('/api/init-db')) {
    if (!isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      );
    }
  }

  // Default response with security headers
  const res = NextResponse.next();
  return addSecurityHeaders(res);
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/:path*',
    '/api/init-db',
  ],
};

