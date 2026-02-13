import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from './lib/supabase-server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 requests per 60 seconds
    analytics: true,
    prefix: 'wiredliving_rl',
  });

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // MIME sniffing protection
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS protection (legacy header, still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Basic permissions policy (lock down powerful APIs)
  // Allow geolocation for weather widget, but restrict other features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // Strict Content Security Policy tuned for this app
  const scriptSrc = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://newsapi.org https://eventregistry.org https://eventregistry.org/api/v1/article https://eventregistry.org/api/v1/article/getArticles https://*.supabase.co https://api.openweathermap.org https://wttr.in",
    "frame-src 'self' https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  
  // Handle legacy auth URLs - redirect to login
  if (pathname === '/auth/signin' || pathname === '/auth/signup') {
    return NextResponse.redirect(new URL('/login', req.url), 301);
  }
  
  // Redirect www to non-www for canonical consistency
  const hostname = req.headers.get('host') || '';
  if (hostname.startsWith('www.')) {
    const newUrl = nextUrl.clone();
    newUrl.host = hostname.replace('www.', '');
    return NextResponse.redirect(newUrl, 301);
  }
  
  console.log('=== MIDDLEWARE START ===');
  console.log('Path:', pathname);
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Create Supabase client and get session
  const { supabase, response } = createMiddlewareClient(req);
  
  // Use getUser() for authenticated data - more secure than getSession()
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error && error.message !== 'Auth session missing!') {
    console.error('Middleware auth error:', error);
  }
  
  const isLoggedIn = !!user;
  
  console.log('Middleware - Path:', pathname, 'Logged in:', isLoggedIn, 'User:', user?.email);

  // Basic IP-based rate limiting for sensitive routes
  const ip =
    (req.ip as string | undefined) ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const isSensitiveApiRoute =
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/init-db');

  if (isSensitiveApiRoute && ratelimit) {
    const rateKey = `${ip}:${pathname}`;
    const result = await ratelimit.limit(rateKey);
    
    if (!result.success) {
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
    console.log('Admin route check - isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
      console.log('NOT LOGGED IN - Redirecting to /login');
      // Redirect to login with callback URL
      const callbackUrl = encodeURIComponent(pathname);
      const redirectResponse = NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
      );
      return addSecurityHeaders(redirectResponse);
    } else {
      console.log('LOGGED IN - Allowing access to /admin');
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
  console.log('=== MIDDLEWARE END - Returning response ===');
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

