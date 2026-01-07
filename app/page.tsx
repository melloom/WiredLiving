import type { Metadata } from 'next';
import { Hero } from '@/components/hero';
import { FeaturedPosts } from '@/components/featured-posts';
import { CTASection } from '@/components/cta-section';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Home',
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.url && { url: siteConfig.url }),
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage || '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage || '/og-image.jpg'],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: siteConfig.url,
    },
  }),
};

export default function Home() {
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.url && { url: siteConfig.url }),
    ...(siteConfig.author.name && {
      author: {
        '@type': 'Person',
        name: siteConfig.author.name,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <Hero />
      <FeaturedPosts />
      <CTASection />
    </>
  );
}

