import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn more about ${siteConfig.name} and our mission`,
  openGraph: {
    title: `About | ${siteConfig.name}`,
    description: `Learn more about ${siteConfig.name} and our mission`,
    ...(siteConfig.url && { url: `${siteConfig.url}/about` }),
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About {siteConfig.name}</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {siteConfig.description}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                At {siteConfig.name}, we&apos;re passionate about sharing knowledge, insights, and stories 
                that inspire and inform. We believe in the power of content to connect, educate, and 
                transform perspectives.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">What We Write About</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Technology trends and innovations</li>
                <li>Lifestyle and personal development</li>
                <li>Creative insights and inspiration</li>
                <li>Tutorials and how-to guides</li>
                <li>Industry news and analysis</li>
              </ul>
            </section>

            {siteConfig.author.name && (
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">About the Author</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {siteConfig.author.name} is the creator and writer behind {siteConfig.name}.
                </p>
                {siteConfig.author.email && (
                  <p className="text-gray-700 dark:text-gray-300">
                    You can reach out at{' '}
                    <a 
                      href={`mailto:${siteConfig.author.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {siteConfig.author.email}
                    </a>
                  </p>
                )}
              </section>
            )}

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
              <div className="flex flex-wrap gap-4">
                {siteConfig.links.twitter && (
                  <a
                    href={siteConfig.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Follow on Twitter
                  </a>
                )}
                {siteConfig.links.github && (
                  <a
                    href={siteConfig.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors"
                  >
                    View on GitHub
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

