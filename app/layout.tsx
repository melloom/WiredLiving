import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { KeyboardShortcut } from '@/components/keyboard-shortcut';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  ...(siteConfig.url && { metadataBase: new URL(siteConfig.url) }),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  ...(siteConfig.author.name && {
    authors: [{ name: siteConfig.author.name, ...(siteConfig.url && { url: siteConfig.url }) }],
    creator: siteConfig.author.name,
    publisher: siteConfig.author.name,
  }),
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/favicon_io/site.webmanifest',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    ...(siteConfig.url && { url: siteConfig.url }),
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage || '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.author.twitter && { creator: siteConfig.author.twitter }),
    images: [siteConfig.ogImage || '/og-image.jpg'],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: siteConfig.url,
    },
  }),
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  category: 'blog',
  classification: 'Blog',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.url && { url: siteConfig.url }),
    ...(siteConfig.author.name && {
      author: {
        '@type': 'Person',
        name: siteConfig.author.name,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon_io/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon_io/android-chrome-512x512.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <KeyboardShortcut />
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

