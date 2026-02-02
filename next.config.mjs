import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Next.js 16: Turbopack is default; empty config acknowledges webpack customizations
  turbopack: {},
  // Redirects for HTTP to HTTPS and www handling
  async redirects() {
    return [
      {
        source: '/reading-list',
        destination: '/bookmarks',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://wiredliving.blog/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.wiredliving.blog',
          },
        ],
        destination: 'https://wiredliving.blog/:path*',
        permanent: true,
      },
    ];
  },
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://platform.twitter.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://wttr.in https://*.supabase.co; manifest-src 'self' https://github.dev https://*.github.dev; frame-src 'self' https://platform.twitter.com;",
          },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable Turbopack for production builds
  experimental: {},
  webpack: (config, { dev, isServer }) => {
    // Fix webpack cache issues in development
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

export default withMDX(nextConfig);

