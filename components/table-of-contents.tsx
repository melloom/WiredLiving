'use client';

import { useEffect, useState, useRef } from 'react';
import { generateHeadingId } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  inline?: boolean;
  onLinkClick?: () => void;
}

/**
 * Clean markdown syntax from text
 */
function cleanMarkdown(text: string): string {
  return text
    // Remove {#id} anchors (anywhere in the text, not just at end)
    .replace(/\s*\{#[^}]+\}\s*/g, '')
    // Remove bold **text** or __text__
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    // Remove italic *text* or _text_
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove inline code `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function TableOfContents({ content, inline = false, onLinkClick }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Extract headings from content (markdown headings)
    const headingRegex = /^(#{1,6})\s+(.+?)(?:\s*\{#([^}]+)\})?$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    
    const extractedHeadings: Heading[] = matches.map((match, index) => {
      const level = match[1].length;
      const fullText = match[2].trim();
      // Clean all markdown syntax from text
      const text = cleanMarkdown(fullText);
      // Use the shared generateHeadingId function for consistent ID generation
      const { id } = generateHeadingId(text);
      return { id, text, level };
    });

    setHeadings(extractedHeadings);

    // Update active heading on scroll
    const updateActiveHeading = () => {
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

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveHeading();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  // For inline (markdown content) version - centered and styled differently
  if (inline) {
    return (
      <div id="table-of-contents" className="my-12 mx-auto max-w-2xl scroll-mt-20">
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-blue-200/50 dark:border-purple-800/30 shadow-lg overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-40 -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-200 to-blue-200 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-40 -z-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Table of Contents
              </h3>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                aria-label={isCollapsed ? 'Expand table of contents' : 'Collapse table of contents'}
              >
                <svg
                  className={`w-5 h-5 text-gray-700 dark:text-gray-300 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {!isCollapsed && (
              <nav className="space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block py-2 px-3 rounded-lg transition-all duration-200 ${
                      heading.level === 1
                        ? 'font-bold text-base text-gray-900 dark:text-gray-100'
                        : heading.level === 2
                        ? 'font-semibold text-sm text-gray-800 dark:text-gray-200 ml-4'
                        : 'font-medium text-sm text-gray-700 dark:text-gray-300 ml-8'
                    } ${
                      activeId === heading.id
                        ? 'bg-white/60 dark:bg-gray-900/40 text-blue-700 dark:text-blue-300 shadow-md border-l-4 border-blue-600'
                        : 'hover:bg-white/40 dark:hover:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onLinkClick?.();
                      setTimeout(() => {
                        const element = document.getElementById(heading.id);
                        if (element) {
                          const yOffset = -100;
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For sidebar version
  return (
    <div className={`${isCollapsed ? 'sticky top-24' : ''} self-start max-h-[calc(100vh-7rem)] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg z-30`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Table of Contents
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? 'Expand table of contents' : 'Collapse table of contents'}
        >
          <svg
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {!isCollapsed && (
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
              onLinkClick?.();
              setTimeout(() => {
                const element = document.getElementById(heading.id);
                if (element) {
                  const yOffset = -100;
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 100);
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
      )}
    </div>
  );
}

