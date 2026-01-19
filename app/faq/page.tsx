import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { FAQClient } from '@/components/faq-client';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | WiredLiving',
  description: 'Frequently asked questions about WiredLiving. Get answers about guest posting, content submissions, collaborations, newsletter subscriptions, and the blog.',
  keywords: [
    'WiredLiving faq',
    'frequently asked questions',
    'guest posting guidelines',
    'blog help',
    'blog questions',
    'how to contribute',
    'collaboration faq',
    'newsletter help',
  ],
  openGraph: {
    title: 'FAQ - Frequently Asked Questions | WiredLiving',
    description: 'Get answers about guest posting, content submissions, collaborations, and using WiredLiving blog.',

    ...(siteConfig.url && { url: `${siteConfig.url}/faq` }),
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'FAQ Page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - Frequently Asked Questions | WiredLiving',
    description: 'Frequently asked questions about guest posting, collaborations, and using WiredLiving.',

    images: [siteConfig.ogImage],
  },
  ...(siteConfig.url && {
    alternates: {
      canonical: `${siteConfig.url}/faq`,
    },
  }),
  robots: {
    index: true,
    follow: true,
  },
};

const faqs = [
  {
    question: 'What is this blog about?',
    answer: `This blog covers topics related to web development, AI integration, SaaS development, and various technical topics. I share tutorials, insights, and experiences from my journey as a developer.`,
  },
  {
    question: 'How often do you publish new posts?',
    answer: 'I aim to publish new content regularly, but there\'s no fixed schedule. I write when I have something valuable to share. You can subscribe to the RSS feed or check back regularly for updates.',
  },
  {
    question: 'Can I use the code examples from your posts?',
    answer: 'Yes! All code examples are provided for educational purposes. Feel free to use them in your projects. If you find them helpful, a link back or attribution is always appreciated but not required.',
  },
  {
    question: 'Do you accept guest posts?',
    answer: 'I\'m open to collaborations and guest posts on topics that align with the blog\'s focus. Please reach out through the contact page with your idea, and we can discuss further.',
  },
  {
    question: 'How can I stay updated with new posts?',
    answer: 'You can subscribe to the RSS feed, follow on social media (links in the footer), or check the blog regularly. I also share updates about new posts on my social channels.',
  },
  {
    question: 'Can I request a specific topic?',
    answer: 'Absolutely! I love hearing from readers about topics they\'d like to see covered. Feel free to reach out through the contact page with your suggestions.',
  },
  {
    question: 'Do you offer consulting or freelance services?',
    answer: 'Yes, I do freelance work and consulting. If you have a project in mind, please reach out through the contact page or check my portfolio for more information about my services.',
  },
  {
    question: 'How can I report an error or issue?',
    answer: 'If you find any errors in a post or encounter issues with the website, please let me know through the contact page. I appreciate feedback and will fix issues as soon as possible.',
  },
];

export default function FAQPage() {
  // Create FAQ structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient faqs={faqs} />
    </>
  );
}

