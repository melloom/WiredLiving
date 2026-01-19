import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Resources & Tools | Useful Links',
  description: `Curated list of useful resources, tools, and links for developers. Handpicked tools and resources that I use and recommend.`,
  keywords: ['Resources', 'Tools', 'Developer Tools', 'Useful Links', 'Web Development'],
  openGraph: {
    title: `Resources & Tools | ${siteConfig.name}`,
    description: 'Curated list of useful resources, tools, and links for developers',
    ...(siteConfig.url && { url: `${siteConfig.url}/resources` }),
    siteName: siteConfig.name,
    type: 'website',
  },
};

const resources = [
  {
    category: 'Development Tools',
    items: [
      {
        name: 'VS Code',
        description: 'Free, open-source code editor with excellent extensions',
        url: 'https://code.visualstudio.com',
        icon: '💻',
      },
      {
        name: 'GitHub',
        description: 'Code hosting platform for version control and collaboration',
        url: 'https://github.com',
        icon: '🐙',
      },
      {
        name: 'Vercel',
        description: 'Deploy frontend applications with zero configuration',
        url: 'https://vercel.com',
        icon: '▲',
      },
      {
        name: 'Supabase',
        description: 'Open source Firebase alternative with PostgreSQL',
        url: 'https://supabase.com',
        icon: '⚡',
      },
    ],
  },
  {
    category: 'Design & UI',
    items: [
      {
        name: 'Tailwind CSS',
        description: 'Utility-first CSS framework for rapid UI development',
        url: 'https://tailwindcss.com',
        icon: '🎨',
      },
      {
        name: 'Figma',
        description: 'Collaborative interface design tool',
        url: 'https://figma.com',
        icon: '🎭',
      },
      {
        name: 'Unsplash',
        description: 'Beautiful, free images for your projects',
        url: 'https://unsplash.com',
        icon: '📸',
      },
    ],
  },
  {
    category: 'Learning Resources',
    items: [
      {
        name: 'MDN Web Docs',
        description: 'Comprehensive documentation for web technologies',
        url: 'https://developer.mozilla.org',
        icon: '📚',
      },
      {
        name: 'Next.js Docs',
        description: 'Official documentation for Next.js framework',
        url: 'https://nextjs.org/docs',
        icon: '⚛️',
      },
      {
        name: 'TypeScript Handbook',
        description: 'Complete guide to TypeScript',
        url: 'https://www.typescriptlang.org/docs',
        icon: '📘',
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  Curated Resources
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Resources & Tools
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Handpicked tools and resources that I use and recommend for development
            </p>
          </div>

          {/* Resources by Category */}
          <div className="space-y-12">
            {resources.map((category, categoryIndex) => (
              <section key={categoryIndex}>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                  {category.category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <a
                      key={itemIndex}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl flex-shrink-0">{item.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {item.description}
                          </p>
                          <div className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:underline">
                            Visit →
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Have a resource to suggest?
              </p>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

