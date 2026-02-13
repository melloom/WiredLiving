import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | WiredLiving',
  description: 'Privacy Policy for WiredLiving. Learn how we collect, use, and protect your personal data. Information about cookies, analytics, and your privacy rights.',
  keywords: ['privacy policy', 'data protection', 'WiredLiving privacy', 'gdpr compliance', 'user data', 'cookie policy', 'privacy rights'],
  openGraph: {
    title: 'Privacy Policy | WiredLiving',
    description: 'Privacy Policy for WiredLiving. Learn how we protect your personal data and respect your privacy.',

    ...(siteConfig.url && { url: `${siteConfig.url}/privacy` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Privacy Policy - ${siteConfig.name}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/privacy`,
    },
  }),
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: January 14, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to {siteConfig.name}. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
          <p className="mb-4">
            We may collect information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Subscribe to our newsletter</li>
            <li>Contact us through our contact form</li>
            <li>Leave comments on blog posts</li>
            <li>Participate in surveys or promotions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
          <p className="mb-4">
            When you visit our website, we automatically collect certain information about your device, including:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages you visit and time spent on pages</li>
            <li>Referring website addresses</li>
            <li>Date and time of your visit</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Provide, maintain, and improve our website</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you newsletters and updates (if you&apos;ve subscribed)</li>
            <li>Analyze website usage and trends</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking Technologies</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
          </p>
          <p className="mb-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
          <p className="mb-4">
            We may use third-party services that collect, monitor, and analyze information to help us improve our website. These third parties may use cookies and other tracking technologies. We do not control these third parties&apos; tracking technologies or how they may be used.
          </p>
          <p className="mb-4">
            Some examples of third-party services we may use include:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Analytics services (e.g., Google Analytics)</li>
            <li>Content delivery networks</li>
            <li>Hosting services</li>
            <li>Email service providers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>The right to access your personal data</li>
            <li>The right to rectify inaccurate personal data</li>
            <li>The right to erase your personal data</li>
            <li>The right to restrict processing of your personal data</li>
            <li>The right to data portability</li>
            <li>The right to object to processing of your personal data</li>
            <li>The right to withdraw consent at any time</li>
          </ul>
          <p className="mb-4">
            To exercise any of these rights, please contact us through our <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
          <p className="mb-4">
            Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Website:</strong> {siteConfig.url}</li>
            <li><strong>Email:</strong> {siteConfig.author.email}</li>
            <li><strong>Owner:</strong> {siteConfig.author.name}</li>
            <li><strong>Contact Form:</strong> <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Visit our contact page</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

