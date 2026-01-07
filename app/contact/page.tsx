import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${siteConfig.name}`,
  openGraph: {
    title: `Contact | ${siteConfig.name}`,
    description: `Get in touch with ${siteConfig.name}`,
    ...(siteConfig.url && { url: `${siteConfig.url}/contact` }),
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Have a question, suggestion, or just want to say hello? We&apos;d love to hear from you!
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
              
              {siteConfig.author.email ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <a 
                      href={`mailto:${siteConfig.author.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {siteConfig.author.email}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Please configure your email in the site configuration.
                </p>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Social Media</h3>
                <div className="flex flex-wrap gap-4">
                  {siteConfig.links.twitter && (
                    <a
                      href={siteConfig.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Twitter
                    </a>
                  )}
                  {siteConfig.links.github && (
                    <a
                      href={siteConfig.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">What Can We Help With?</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Questions about our content</li>
                <li>Collaboration opportunities</li>
                <li>Feedback and suggestions</li>
                <li>Technical inquiries</li>
                <li>General inquiries</li>
              </ul>
            </section>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> We try to respond to all messages within 24-48 hours. 
                Thank you for your patience!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

