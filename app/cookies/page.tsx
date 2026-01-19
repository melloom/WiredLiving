import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Cookie Policy | ${siteConfig.name}`,
  description: `Learn about how ${siteConfig.name} uses cookies and similar technologies to enhance your browsing experience.`,
  keywords: ['Cookie Policy', 'Cookies', 'Privacy', 'Tracking', siteConfig.name],
  openGraph: {
    title: `Cookie Policy | ${siteConfig.name}`,
    description: `Learn about how we use cookies`,
    ...(siteConfig.url && { url: `${siteConfig.url}/cookies` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Cookie Policy - ${siteConfig.name}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/cookies`,
    },
  }),
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: January 14, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">
            {siteConfig.name} uses cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and security features.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
            <li><strong>Preference Cookies:</strong> Enable the website to remember information that changes the way the website behaves or looks, such as your preferred language or theme.</li>
            <li><strong>Functionality Cookies:</strong> Used to recognize you when you return to our website and to remember your preferences.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Session Cookies</h3>
          <p className="mb-4">
            These temporary cookies are erased when you close your browser. They are used to maintain your session state as you navigate through the website.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Persistent Cookies</h3>
          <p className="mb-4">
            These cookies remain on your device until they expire or you delete them. They help us recognize you as a returning visitor and remember your preferences.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Third-Party Cookies</h3>
          <p className="mb-4">
            We may use third-party services that set their own cookies on your device. These include:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Analytics services (e.g., Google Analytics, Vercel Analytics)</li>
            <li>Authentication providers</li>
            <li>Content delivery networks (CDNs)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
          <p className="mb-4">
            You can control and manage cookies in various ways:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites.</li>
            <li><strong>Opt-Out Tools:</strong> You can opt out of third-party cookies through tools like the Network Advertising Initiative opt-out page.</li>
            <li><strong>Do Not Track:</strong> Some browsers support &quot;Do Not Track&quot; signals, though not all websites honor these requests.</li>
          </ul>
          <p className="mb-4">
            Please note that blocking or deleting cookies may impact your experience on our website and limit certain features.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookie Retention</h2>
          <p className="mb-4">
            We retain cookies for varying periods depending on their purpose:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Session cookies: Deleted when you close your browser</li>
            <li>Authentication cookies: Typically 30 days</li>
            <li>Preference cookies: Up to 1 year</li>
            <li>Analytics cookies: Up to 2 years</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our practices. We will post any changes on this page with an updated revision date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="mb-4">
            If you have questions about our use of cookies, please contact us:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Website:</strong> {siteConfig.url}</li>
            <li><strong>Email:</strong> {siteConfig.author.email}</li>
            <li><strong>Owner:</strong> {siteConfig.author.name}</li>
            <li><strong>Contact Form:</strong> <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Visit our contact page</Link></li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Related Policies:{' '}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
            {' · '}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
