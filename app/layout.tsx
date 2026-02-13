import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import { siteConfig } from '@/config/site';
import { KeyboardShortcut } from '@/components/keyboard-shortcut';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Providers } from '@/components/providers';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevents invisible text during font loading
  preload: true,   // Explicitly set preload
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

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
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
        url: '/MAIN PIC.png',
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
    images: ['/MAIN PIC.png'],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: siteConfig.url,
    },
  }),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // Add your verification codes here when available
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
      ...(siteConfig.url && { url: siteConfig.url }),
      ...(siteConfig.ogImage && {
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
        },
      }),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    ...(siteConfig.url && { url: siteConfig.url }),
    ...(siteConfig.ogImage && {
      logo: `${siteConfig.url}${siteConfig.ogImage}`,
    }),
    description: siteConfig.description,
    ...(siteConfig.author.email && { email: siteConfig.author.email }),
    sameAs: [
      siteConfig.links.portfolio,
      siteConfig.links.socialHub,
    ].filter(Boolean),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={siteConfig.url} />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WiredLiving" />
        <meta name="application-name" content="WiredLiving" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta property="og:image" content={`${siteConfig.url}/MAIN PIC.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={siteConfig.name} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteConfig.url} />
        <meta property="og:site_name" content={siteConfig.name} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${siteConfig.url}/MAIN PIC.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* ThemeProvider ensures theme context and <html> class for all pages */}
        <div suppressHydrationWarning>
          <Providers>
            <AnalyticsTracker />
            <KeyboardShortcut />
            <PWAInstallPrompt />
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </div>
      </body>
    </html>
  );
}

