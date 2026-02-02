import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | WiredLiving',
  description: 'Terms of Service for WiredLiving. Read our terms and conditions, user agreement, and usage guidelines for accessing our blog and services.',
  keywords: ['terms of service', 'user agreement', 'WiredLiving terms', 'terms and conditions', 'legal terms', 'website terms', 'blog terms'],
  openGraph: {
    title: 'Terms of Service | WiredLiving',
    description: 'Terms of Service for WiredLiving. User agreement and usage guidelines for our blog.',

    ...(siteConfig.url && { url: `${siteConfig.url}/terms` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Terms of Service - ${siteConfig.name}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/terms`,
    },
  }),
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: January 14, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using {siteConfig.name} (the &quot;Website&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily access the materials on {siteConfig.name} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
          <p className="mb-4">
            The materials on {siteConfig.name} are provided on an &apos;as is&apos; basis. {siteConfig.name} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
          <p className="mb-4">
            In no event shall {siteConfig.name} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {siteConfig.name}, even if {siteConfig.name} or a {siteConfig.name} authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Accuracy of Materials</h2>
          <p className="mb-4">
            The materials appearing on {siteConfig.name} could include technical, typographical, or photographic errors. {siteConfig.name} does not warrant that any of the materials on its website are accurate, complete, or current. {siteConfig.name} may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Links</h2>
          <p className="mb-4">
            {siteConfig.name} has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by {siteConfig.name} of the site. Use of any such linked website is at the user&apos;s own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
          <p className="mb-4">
            {siteConfig.name} may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
          <p className="mb-4">
            These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
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

