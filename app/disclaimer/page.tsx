import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer | WiredLiving',
  description: 'Legal disclaimer for WiredLiving. Important information about content accuracy, liability, affiliate links, and professional advice disclaimers.',
  keywords: ['disclaimer', 'legal disclaimer', 'WiredLiving disclaimer', 'content disclaimer', 'liability notice', 'affiliate disclosure', 'professional advice'],
  openGraph: {
    title: 'Disclaimer | WiredLiving',
    description: 'Legal disclaimer for WiredLiving. Important information about content accuracy and liability.',

    ...(siteConfig.url && { url: `${siteConfig.url}/disclaimer` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Disclaimer - ${siteConfig.name}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/disclaimer`,
    },
  }),
};

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Disclaimer</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: January 14, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. General Information</h2>
          <p className="mb-4">
            The information provided by {siteConfig.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) on this website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. No Professional Advice</h2>
          <p className="mb-4">
            The content on {siteConfig.name} is not intended to be a substitute for professional advice. You should always seek the advice of qualified professionals with any questions you may have regarding:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Legal matters</li>
            <li>Financial decisions</li>
            <li>Medical or health concerns</li>
            <li>Technical implementations</li>
            <li>Business strategy</li>
          </ul>
          <p className="mb-4">
            Never disregard professional advice or delay in seeking it because of something you have read on this website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. External Links Disclaimer</h2>
          <p className="mb-4">
            This website may contain links to external websites that are not provided or maintained by or in any way affiliated with {siteConfig.name}.
          </p>
          <p className="mb-4">
            Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. We are not responsible for the content, privacy policies, or practices of any third-party sites or services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Accuracy of Information</h2>
          <p className="mb-4">
            While we strive to keep the information on {siteConfig.name} up to date and correct, we make no representations or warranties of any kind about:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>The completeness, accuracy, or reliability of information</li>
            <li>The suitability or availability of the website or information for any particular purpose</li>
            <li>That the website will be error-free or uninterrupted</li>
          </ul>
          <p className="mb-4">
            Any reliance you place on such information is strictly at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p className="mb-4">
            Under no circumstances shall we be liable for any loss or damage, including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Loss of data or profits arising out of, or in connection with, the use of this website</li>
            <li>Your use of or reliance on any content, goods, or services available on or through this website</li>
            <li>Inability to use the website</li>
            <li>Unauthorized access to or alteration of your transmissions or data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Technology and Code Disclaimer</h2>
          <p className="mb-4">
            Any code snippets, tutorials, or technical information provided on this website are offered &quot;as is&quot; without warranty of any kind. While we test and review content, we cannot guarantee that:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Code will work in all environments or configurations</li>
            <li>Implementations will be free from bugs or security vulnerabilities</li>
            <li>Solutions will meet your specific requirements</li>
            <li>Instructions are complete or current with the latest technology updates</li>
          </ul>
          <p className="mb-4">
            Always test code in a safe environment before deploying to production systems.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. User-Generated Content</h2>
          <p className="mb-4">
            Comments, feedback, and other user-generated content on {siteConfig.name} represent the views and opinions of their respective authors, not those of {siteConfig.name} or its staff. We do not endorse or verify user-generated content and are not responsible for its accuracy or reliability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes and Updates</h2>
          <p className="mb-4">
            We reserve the right to modify, update, or remove any content on this website at any time without prior notice. We are not obligated to update information or correct inaccuracies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Affiliate Disclaimer</h2>
          <p className="mb-4">
            {siteConfig.name} may contain affiliate links, which means we may earn a commission if you click through and make a purchase. This comes at no additional cost to you and helps support the website. We only recommend products or services that we believe will add value to our readers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Errors and Omissions</h2>
          <p className="mb-4">
            While we make every effort to ensure that the information on this website is correct, {siteConfig.name} does not warrant its completeness or accuracy. We will not be liable for any errors or omissions in the information provided or for any actions taken in reliance on such information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about this disclaimer, please contact us:
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
            Related Legal Documents:{' '}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>
            {' · '}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
            {' · '}
            <Link href="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline">
              Cookie Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
