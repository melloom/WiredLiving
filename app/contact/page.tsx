import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { ContactForm } from '@/components/contact-form';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact WiredLiving - Get in Touch',
  description: 'Contact WiredLiving for inquiries, collaborations, guest posting opportunities, or just to say hello. Reach out via our contact form or email me directly.',
  keywords: [
    'contact WiredLiving',
    'get in touch',
    'contact form',
    'blog contact',
    'collaboration opportunities',
    'guest posting',
    'partnership inquiry',
    'reach out',
    'WiredLiving contact',
  ],
  authors: [{ name: siteConfig.author.name }],
  openGraph: {
    title: 'Contact WiredLiving - Get in Touch',
    description: 'Contact WiredLiving for inquiries, collaborations, guest posting, or just to say hello. Send me a message through the contact form.',

    ...(siteConfig.url && { url: `${siteConfig.url}/contact` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Contact ${siteConfig.name}`,
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact WiredLiving - Get in Touch',
    description: 'Contact WiredLiving for inquiries, collaborations, guest posting, or just to say hello.',

    images: [siteConfig.ogImage],
    ...(siteConfig.author.twitter && { creator: `@${siteConfig.author.twitter}` }),
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/contact`,
    },
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function ContactPage() {
  const contactPageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact | ${siteConfig.name}`,
    description: 'Contact page for getting in touch with Melvin',
    mainEntity: {
      '@type': 'Person',
      name: 'Melvin',
      jobTitle: 'Full-Stack Developer & AI Integrator',
    },
  };

  if (siteConfig.url) {
    contactPageSchema.url = `${siteConfig.url}/contact`;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    Let&apos;s Connect
                  </span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Get in Touch
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Have a project in mind? Want to collaborate? Or just want to chat about tech?
                I&apos;m always open to new opportunities and conversations.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="order-2 lg:order-1">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Send a Message
                  </h2>
                  <ContactForm />
                </div>
              </div>

              {/* Contact Information */}
              <div className="order-1 lg:order-2 space-y-6">
                {/* Quick Info Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Quick Contact
                  </h2>
                  <div className="space-y-6">
                    {siteConfig.author.email && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Email</h3>
                          <a
                            href={`mailto:${siteConfig.author.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {siteConfig.author.email}
                          </a>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Send me an email directly
                          </p>
                        </div>
                      </div>
                    )}

                    {siteConfig.links.portfolio && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Portfolio</h3>
                          <a
                            href={siteConfig.links.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {siteConfig.links.portfolio.replace(/^https?:\/\//, '')}
                          </a>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Check out my projects and work
                          </p>
                        </div>
                      </div>
                    )}

                    {siteConfig.links.socialHub && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Social Hub</h3>
                          <a
                            href={siteConfig.links.socialHub}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {siteConfig.links.socialHub.replace(/^https?:\/\//, '')}
                          </a>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            All my social links in one place
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* What I Can Help With */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    What I Can Help With
                  </h2>
                  <ul className="space-y-3">
                    {[
                      'Full-stack web development',
                      'AI integration & automation',
                      'SaaS product development',
                      'Game development',
                      'Technical consulting',
                      'Code reviews & mentorship',
                      'Freelance projects',
                      'Collaborations & partnerships',
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Response Time */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Response Time</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        I typically respond within 24-48 hours. For urgent matters, feel free to reach out via my social links.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-16 text-center">
              <div className="inline-block p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  💬 Always open to collabs, freelancing, or just a good dev chat.
                </p>
                <Link
                  href="/about"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Learn more about me →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
