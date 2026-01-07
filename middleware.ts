import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis rate limiting (shared across all instances)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const ratelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'), // 60 requests per 60 seconds
    analytics: true,
    prefix: 'wiredliving_rl',
  });

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

  // Strict Content Security Policy tuned for this app
  // Note: Adjust if you add more external resources
  const csp = [
    "default-src 'self'",
    // Next.js / React need 'unsafe-eval' in dev sometimes, but we'll keep it off in prod
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://newsapi.org https://eventregistry.org https://eventregistry.org/api/v1/article https://eventregistry.org/api/v1/article/getArticles",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

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
    if (ratelimit) {
      // Use Upstash Redis rate limiter when configured
      return ratelimit.limit(rateKey).then((result) => {
        if (!result.success) {
          return addSecurityHeaders(
            NextResponse.json(
              { success: false, error: 'Too many requests. Please slow down.' },
              { status: 429 }
            )
          );
        }
        // Allow request to continue below
        return null;
      }) as any;
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

