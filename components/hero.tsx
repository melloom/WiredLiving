'use client';

import Link from 'next/link';

interface HeroProps {
  siteName: string;
  description: string;
}

export function Hero({ siteName, description }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5" />

      {/* Animated particles/circuit pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500 rounded-full animate-pulse particle-1" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-500 rounded-full animate-pulse particle-2" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse particle-3" />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-pulse particle-4" />

        {/* Circuit lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            d="M 100 200 Q 300 100 500 200 T 900 200"
            stroke="url(#circuitGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-draw"
          />
          <path
            d="M 200 400 Q 400 300 600 400 T 1000 400"
            stroke="url(#circuitGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-draw circuit-path-2"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Techy animated badge */}
          <div className="mb-8 flex justify-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative px-6 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 pb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
            WiredLiving
          </h1>

          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-600" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-600" />
          </div>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/blog"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <span className="relative z-10">Explore Blog</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button
              onClick={() => {
                const element = document.getElementById('latest-posts');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  window.scrollTo({ top: 600, behavior: 'smooth' });
                }
              }}
              className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-white dark:hover:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all transform hover:scale-105"
            >
              Latest Posts
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

