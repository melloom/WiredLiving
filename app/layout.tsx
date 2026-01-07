import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

