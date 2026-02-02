import type { Metadata } from 'next';
import { Hero } from '@/components/hero';
import { FeaturedPosts } from '@/components/featured-posts';
import { getFeaturedPosts, getAllPosts } from '@/lib/supabase-db';
import { CTASection } from '@/components/cta-section';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author.name, url: siteConfig.links.portfolio }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'WiredLiving - Personal Blog & Lifestyle Hub',
    description: 'A personal blog exploring life, ideas, and everything in between. Join me for insights, stories, and reflections on the things that matter.',

    ...(siteConfig.url && { url: siteConfig.url }),
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Personal Blog & Lifestyle Hub`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WiredLiving - Personal Blog & Lifestyle Hub',
    description: 'A personal blog exploring life, ideas, and everything in between. Join me for insights, stories, and reflections.',

    images: [siteConfig.ogImage],
    ...(siteConfig.author.twitter && { creator: `@${siteConfig.author.twitter}` }),
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: siteConfig.url,
      types: {
        'application/rss+xml': `${siteConfig.url}/feed`,
      },
    },
    metadataBase: new URL(siteConfig.url),
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
    yandex: '',
    yahoo: '',
  },
};

export default async function Home() {
  const featuredPosts = await getFeaturedPosts(3);
  const allPosts = await getAllPosts();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.url && { url: siteConfig.url }),
    ...(siteConfig.url && {
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
    inLanguage: 'en-US',
  };

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
        ...(siteConfig.url && { url: siteConfig.links.portfolio }),
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <Hero siteName={siteConfig.name} description={siteConfig.description} />
      <FeaturedPosts posts={featuredPosts} allPosts={allPosts} />
      <CTASection />
    </>
  );
}

