import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // ESLint configuration for Next.js
  eslint: {
    // Use the flat config format (eslint.config.mjs)
    // This prevents Next.js from using deprecated options
    dirs: ['app', 'components', 'lib', 'types'],
  },
  // Ensure production builds use proper optimization
  swcMinify: true,
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

