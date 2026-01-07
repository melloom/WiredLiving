'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from content (markdown headings)
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    
    const extractedHeadings: Heading[] = matches.map((match, index) => {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      return { id, text, level };
    });

    setHeadings(extractedHeadings);

    // Update active heading on scroll
    const handleScroll = () => {
      const headingElements = extractedHeadings.map(h => document.getElementById(h.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(extractedHeadings[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Table of Contents
      </h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-xs py-1.5 px-2 rounded transition-colors ${
              heading.level === 1
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : heading.level === 2
                ? 'font-medium text-gray-700 dark:text-gray-300 pl-4'
                : 'text-gray-600 dark:text-gray-400 pl-6'
            } ${
              activeId === heading.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(heading.id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

