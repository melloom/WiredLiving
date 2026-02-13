import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Newsletter - Subscribe to WiredLiving Updates',
  description: 'Subscribe to WiredLiving newsletter and receive the latest articles, stories, and insights directly in your inbox. Weekly updates on life, ideas, and everything in between.',
  keywords: ['WiredLiving newsletter', 'blog newsletter', 'subscribe email updates', 'blog updates', 'weekly digest', 'personal blog newsletter'],
  openGraph: {
    title: 'Newsletter - Subscribe to WiredLiving Updates',
    description: 'Subscribe to receive the latest articles, stories, and insights in your inbox.',

    ...(siteConfig.url && { url: `${siteConfig.url}/newsletter` }),
    siteName: siteConfig.name,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/newsletter`,
    },
  }),
};

export default function NewsletterPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Newsletter</h1>
        <p className="text-2xl text-muted-foreground">Coming Soon</p>
        <p className="text-muted-foreground max-w-md">
          We're working on bringing you the best newsletter experience. Stay tuned!
        </p>
        <Link 
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

