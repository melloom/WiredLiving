import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { FAQClient } from '@/components/faq-client';

export const metadata: Metadata = {
  title: 'FAQ | Frequently Asked Questions',
  description: `Frequently asked questions about ${siteConfig.name}. Find answers to common questions about the blog, content, and more.`,
  keywords: ['FAQ', 'Questions', 'Help', 'Support', 'Common Questions'],
  openGraph: {
    title: `FAQ | ${siteConfig.name}`,
    description: 'Frequently asked questions and answers',
    ...(siteConfig.url && { url: `${siteConfig.url}/faq` }),
    siteName: siteConfig.name,
    type: 'website',
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
  return <FAQClient faqs={faqs} />;
}

