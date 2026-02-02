
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import remarkSmartypants from 'remark-smartypants';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import Link from 'next/link';
import React, { useState, useRef, useMemo, memo } from 'react';
import { transformAndValidateContent } from '@/lib/markdown-transformer';
import { generateHeadingId } from '@/lib/utils';
import { TableOfContents } from '@/components/table-of-contents';

interface MDXContentProps {
  content: string;
  onValidationComplete?: (issues: any[], warnings: any[]) => void;
}

// Spoiler/Hidden Text component - click to reveal
function SpoilerText({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`inline-block px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
        revealed
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          : 'bg-gray-900 dark:bg-gray-700 text-transparent select-none hover:bg-gray-800 dark:hover:bg-gray-600'
      }`}
      title={revealed ? 'Click to hide' : 'Click to reveal spoiler'}
    >
      {revealed ? children : '█████████'}
    </span>
  );
}

// Twitter/Social Embed component
function TwitterEmbed({ url }: { url: string }) {
  const tweetId = url.match(/status\/(\d+)/)?.[1];
  
  if (!tweetId) {
    return (
      <div className="my-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
          {url}
        </a>
      </div>
    );
  }
  
  return (
    <div className="my-8 flex justify-center">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={url} target="_blank" rel="noopener noreferrer">View Tweet</a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
    </div>
  );
}

// Enhanced Video component for blog posts (visitor-facing)
function BlogVideo({ src, controls = true, poster, className, ...props }: any) {
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  return (
    <div className="relative w-full my-8 scroll-mt-20">
      {videoLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse min-h-[400px]">
          <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading video...
          </div>
        </div>
      )}
      {videoError ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-12 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-6xl mb-3">🎬</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <div className="font-medium mb-1">Video unavailable</div>
            <div className="text-xs break-all max-w-md">{src}</div>
          </div>
        </div>
      ) : (
        <video
          controls={controls}
          poster={poster}
          className={`w-full rounded-lg shadow-xl ${videoLoading ? 'opacity-0' : 'opacity-100 transition-opacity'} ${className || ''}`}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => {
            setVideoLoading(false);
            setVideoError(true);
          }}
          preload="metadata"
          playsInline
          {...props}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          <source src={src} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

// Enhanced iframe component for embeds (YouTube, Vimeo, etc.)
function BlogIframe({ src, className, width, height, title, ...props }: any) {
  const defaultHeight = height || '500';
  const defaultWidth = width || '100%';

  return (
    <div className="my-8 scroll-mt-20">
      <div className={`relative ${height ? '' : 'pb-[56.25%]'}`}>
        <iframe
          src={src}
          title={title || 'Embedded content'}
          width={defaultWidth}
          height={defaultHeight}
          className={`rounded-lg shadow-xl ${height ? '' : 'absolute top-0 left-0 w-full h-full'} ${className || ''}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          {...props}
        />
      </div>
    </div>
  );
}


// Counters moved to component state to fix hydration issues

// Code block component with copy button
function CodeBlockWithCopy({ id, language, code, className, children }: { id: string; language: string; code: string; className?: string; children?: any }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div id={id} className="relative my-6 scroll-mt-20 group">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 rounded-t-lg">
        {language && language !== 'code' && (
          <div className="text-xs font-semibold text-gray-300 dark:text-gray-400 font-mono uppercase tracking-wider">
            {language}
          </div>
        )}
        {!language || language === 'code' ? <div></div> : null}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto bg-gray-900 dark:bg-black rounded-b-lg">
        <pre className="m-0 p-0 bg-transparent overflow-x-auto">
          <code className={`${className || ''} block p-4 text-sm text-gray-100 font-mono overflow-x-auto whitespace-pre text-gray-200`} {...{ 'data-language': language }}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function MDXContent({ content, onValidationComplete }: MDXContentProps) {
  // Use ref counters to maintain consistent IDs across server/client renders
  const tableCounterRef = useRef(0);
  const codeCounterRef = useRef(0);
  const imageCounterRef = useRef(0);
  const calloutCounterRef = useRef(0);
  const checklistCounterRef = useRef(0);
  
  // Transform and validate content automatically
  // This AUTOMATICALLY fixes issues without user intervention!
  const validationResult = transformAndValidateContent(content);

  // Don't remove [TOC] marker - it will be handled by custom paragraph component
  // This allows [TOC] to stay exactly where the user placed it

  // Reset element counters for fresh ID generation
  tableCounterRef.current = 0;
  codeCounterRef.current = 0;
  imageCounterRef.current = 0;
  calloutCounterRef.current = 0;
  checklistCounterRef.current = 0;

  // Notify parent component of what was fixed
  if (onValidationComplete) {
    onValidationComplete(validationResult.issues, validationResult.warnings);
  }

  // Log if we made auto-fixes in development
  if (process.env.NODE_ENV === 'development') {
    if (validationResult.wasModified) {
      console.log('✨ Auto-formatted your content:', {
        headingIDsAdded: validationResult.headings.length,
        hasIssues: validationResult.issues.length > 0,
        hasWarnings: validationResult.warnings.length > 0,
      });
    }
    if (validationResult.warnings.length > 0) {
      console.warn('📝 Remaining issues to review:', validationResult.warnings);
    }
  }

  return (
    <div dir="ltr">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          // Smart typography (quotes, dashes, ellipses)
          // Keep after GFM so punctuation in tables/lists is handled well
          remarkSmartypants,
          // Mark first (non-TOC) paragraph for drop cap (data-first)
          function remarkFirstParagraph() {
            let foundFirst = false;
            return (tree: any) => {
              visit(tree, 'paragraph', (node: any) => {
                if (foundFirst) return;
                const children = node.children || [];
                if (children.length === 1 && children[0].type === 'text') {
                  const value = String(children[0].value || '').trim();
                  if (value.toUpperCase() === '[TOC]') return; // skip TOC placeholder
                }
                foundFirst = true;
                node.data = node.data || {};
                node.data.hProperties = { ...(node.data.hProperties || {}), 'data-first': true };
              });
            };
          },
          // Remark plugin to convert "[TOC]" paragraphs into a custom HTML tag
          function remarkTocMarker() {
            return (tree: any) => {
              visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
                if (!parent || index == null) return;
                const children = node.children || [];
                if (children.length === 1 && children[0].type === 'text') {
                  const value = String(children[0].value || '').trim();
                  if (value.toUpperCase() === '[TOC]') {
                    parent.children[index] = {
                      type: 'html',
                      value: '<toc-inline></toc-inline>'
                    };
                  }
                }
              });
            };
          },
          // Remark plugin to handle ==highlight==, ||spoiler||, and Twitter embeds
          function remarkCustomSyntax() {
            return (tree: any) => {
              visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
                if (!parent || index == null || !node.value) return;
                let value = node.value;
                
                // Replace ==highlight== with <mark>
                value = value.replace(/==(.*?)==/g, '<mark>$1</mark>');
                
                // Replace ||spoiler|| with custom spoiler tag
                value = value.replace(/\|\|(.*?)\|\|/g, '<spoiler-text>$1</spoiler-text>');
                
                if (value !== node.value) {
                  parent.children[index] = {
                    type: 'html',
                    value: value
                  };
                }
              });
              
              // Handle Twitter embeds - detect twitter.com links in paragraphs
              visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
                if (!parent || index == null) return;
                const children = node.children || [];
                
                // Check if paragraph contains only a Twitter link
                if (children.length === 1 && children[0].type === 'link') {
                  const href = children[0].url || '';
                  if (href.includes('twitter.com') || href.includes('x.com')) {
                    parent.children[index] = {
                      type: 'html',
                      value: `<twitter-embed url="${href}"></twitter-embed>`
                    };
                  }
                }
              });
            };
          }
        ]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        className="prose dark:prose-invert max-w-none"
        components={{
        // Custom HTML tag injected by remark plugin above
        'toc-inline': () => (
          <TableOfContents content={validationResult.transformedContent} inline={true} />
        ),
        // Twitter embed component
        'twitter-embed': ({ url }: { url: string }) => (
          <TwitterEmbed url={url} />
        ),
        // Custom paragraph component that handles [TOC] marker
        p: ({ children, ...props }: any) => {
          const childrenText = String(children || '');
          // Check if this paragraph contains just [TOC]
          if (childrenText.trim().toUpperCase() === '[TOC]') {
            return <TableOfContents content={validationResult.transformedContent} inline={true} />;
          }
          // Normal paragraph rendering (from existing p component below)
          const isFirst = props['data-first'] === true;
          const hasNoDropCapComment = typeof children === 'string' && (
            children.includes('<!-- no-dropcap -->') ||
            children.includes('<!--nodropcap-->') ||
            children.includes('<!--no-dropcap-->')
          );
          const cleanChildren = hasNoDropCapComment
            ? childrenText.replace(/<!--\s*no-dropcap\s*-->/gi, '').trim()
            : children;
          const shouldShowDropCap = isFirst && !hasNoDropCapComment;
          return (
            <p className={`font-serif text-lg md:text-xl leading-relaxed md:leading-[1.75] my-6 md:my-7 text-gray-800 dark:text-gray-200 tracking-wide ${shouldShowDropCap ? 'first-letter:text-6xl first-letter:md:text-7xl first-letter:lg:text-8xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-none first-letter:text-blue-600 dark:first-letter:text-blue-400 first-letter:drop-cap' : ''}`}>
              {cleanChildren}
            </p>
          );
        },
        // Custom heading components with auto-generated IDs and serif font
        h1: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mt-12 mb-8 pb-4 text-gray-900 dark:text-gray-50 leading-tight scroll-mt-24 border-b-2 border-gray-200 dark:border-gray-700 tracking-tight group relative" id={id}>
              <a href={`#${id}`} className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400" aria-label="Link to heading">#</a>
              {cleanText}
            </h1>
          );
        },
        h2: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mt-12 mb-7 text-gray-900 dark:text-gray-50 leading-tight scroll-mt-24 tracking-tight" id={id}>
              {cleanText}
            </h2>
          );
        },
        h3: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h3 className="font-serif text-2xl md:text-3xl font-semibold mt-10 mb-6 text-gray-800 dark:text-gray-100 leading-snug scroll-mt-24 tracking-tight border-l-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-colors pl-3" id={id}>
              {cleanText}
            </h3>
          );
        },
        h4: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h4 className="font-serif text-xl md:text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-50 leading-snug scroll-mt-24 tracking-tight" id={id}>
              {cleanText}
            </h4>
          );
        },
        h5: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h5 className="font-serif text-lg md:text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-50 scroll-mt-24 tracking-tight" id={id}>
              {cleanText}
            </h5>
          );
        },
        h6: ({ children }: { children: React.ReactNode }) => {
          const { id, cleanText } = generateHeadingId(String(children));
          return (
            <h6 className="font-serif text-base md:text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-50 scroll-mt-24 tracking-tight" id={id}>
              {cleanText}
            </h6>
          );
        },
        // Lists with better spacing and serif font
        ol: ({ children }: { children: React.ReactNode }) => (
          <ol className="font-serif my-8 space-y-4 text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200 list-decimal list-outside ml-6 md:ml-8 tracking-wide">
            {children}
          </ol>
        ),
        // Strong/Bold text
        strong: ({ children }: { children: React.ReactNode }) => (
          <strong className="font-bold text-gray-900 dark:text-white">
            {children}
          </strong>
        ),
        // Emphasis/Italic text
        em: ({ children }: { children: React.ReactNode }) => (
          <em className="italic text-gray-800 dark:text-gray-200">
            {children}
          </em>
        ),
        // Mark/Highlight text (==highlighted==)
        mark: ({ children }: { children: React.ReactNode }) => (
          <mark className="bg-yellow-200 dark:bg-yellow-700/40 text-gray-900 dark:text-gray-100 px-1 rounded">
            {children}
          </mark>
        ),
        // Underline text (<u>underlined</u>)
        u: ({ children }: { children: React.ReactNode }) => (
          <u className="underline decoration-2 decoration-blue-500 dark:decoration-blue-400 underline-offset-2">
            {children}
          </u>
        ),
        // Spoiler text (||spoiler||)
        'spoiler-text': ({ children }: { children: React.ReactNode }) => (
          <SpoilerText>{children}</SpoilerText>
        ),
        // Horizontal rule
        hr: ({ ...props }: { [key: string]: any }) => (
          <hr className="my-16 border-2 border-gray-200 dark:border-gray-700 rounded" {...props} />
        ),
        // Custom table component with ID for quick-link navigation and enhanced styling with zebra striping
        table: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
          const tableId = ++tableCounterRef.current;
          return (
            <div id={`tbl-table-${tableId}`} className="overflow-x-auto my-8 scroll-mt-20 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                {children}
              </table>
            </div>
          );
        },
        // Enhanced table headers
        th: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-600" {...props}>
            {children}
          </th>
        ),
        // Enhanced table cells with hover effects
        td: ({ children, ...props }: any) => {
          // Allow wrapping for longer content
          const shouldWrap = typeof children === 'string' && children.length > 50;
          return (
            <td className={`px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${shouldWrap ? 'break-words' : 'whitespace-nowrap'}`} {...props}>
              {children}
            </td>
          );
        },
        // Custom image component with lazy loading, optimization, size, and alignment support
        img: ({ src = '', alt = '', className = '', ...props }: any) => {
          // Use a stable ID based on src to avoid hydration mismatches
          const imageId = `img-${src ? src.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) : ++imageCounterRef.current}`;

          // Detect GIF files (including animated GIFs from Giphy/Tenor)
          const isGif = /\.gif$/i.test(src) || src.includes('giphy.com') || src.includes('tenor.com');

          // Proxy external images to avoid CORS/OpaqueResponseBlocking issues
          let processedSrc = src;
          if (src && /^https?:\/\//.test(src)) {
            // Check if it's not from our own domain or storage
            const isExternal = !src.includes('wiredliving.blog') &&
                              !src.includes('supabase.co') &&
                              !src.startsWith('/');

            if (isExternal) {
              // For GIFs, still proxy them but with optimization hint
              processedSrc = `/api/proxy-image?url=${encodeURIComponent(src)}&format=${isGif ? 'gif' : 'auto'}`;
            }
          }

          // Parse alignment
          const align = props.align ||
            (className?.includes('float-right') || className?.includes('align-right') ? 'right' :
             className?.includes('float-left') || className?.includes('align-left') ? 'left' :
             className?.includes('align-center') ? 'center' : 'center');

          const isFloatRight = align === 'right';
          const isFloatLeft = align === 'left';
          const isCentered = align === 'center' || (!isFloatRight && !isFloatLeft);

          // Parse size
          const isSmall = className?.includes('size-small') || className?.includes('img-small');
          const isMedium = className?.includes('size-medium') || className?.includes('img-medium');
          const isLarge = className?.includes('size-large') || className?.includes('img-large');
          const isFullWidth = className?.includes('full-width') || className?.includes('size-full');

          // Size classes
          let sizeClasses = '';
          if (isSmall) {
            sizeClasses = 'max-w-xs';
          } else if (isMedium) {
            sizeClasses = 'max-w-md';
          } else if (isLarge) {
            sizeClasses = 'max-w-2xl';
          } else if (isFullWidth) {
            sizeClasses = 'w-full';
          } else {
            sizeClasses = 'max-w-xl'; // Default medium
          }

          // Alignment classes
          let alignmentClasses = '';
          if (isFloatRight) {
            alignmentClasses = `float-right ml-4 mb-4 ${sizeClasses}`;
          } else if (isFloatLeft) {
            alignmentClasses = `float-left mr-4 mb-4 ${sizeClasses}`;
          } else if (isFullWidth) {
            alignmentClasses = 'block w-full my-8';
          } else {
            alignmentClasses = `block mx-auto my-8 ${sizeClasses}`;
          }

          // Use contentVisibility to optimize rendering performance
          // This prevents layout shift and improves scroll responsiveness
          return (
            <img
              id={imageId}
              src={processedSrc}
              alt={alt || 'Blog image'}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              style={{ contentVisibility: 'auto' } as any}
              className={`rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl scroll-mt-20 will-change-auto ${alignmentClasses}`}
              {...props}
            />
          );
        },
        // Custom link handling with icons for external links
        a: ({ href = '', children, ...props }: { href?: string; children: React.ReactNode; [key: string]: any }) => {
          // If the link is external (starts with http), use <a> with target _blank
          if (/^https?:\/\//.test(href)) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors no-underline hover:underline group"
                {...props}
              >
                {children}
                <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            );
          }
          // Otherwise, use Next.js Link for internal navigation
          return (
            <Link href={href} {...props} legacyBehavior>
              <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors no-underline hover:underline">{children}</a>
            </Link>
          );
        },
        // Enhanced code elements with keyboard keys and syntax highlighting
        code: ({ className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).trim();
          const isCodeBlock = !!match;
          const isInline = !isCodeBlock;

          // Style keyboard keys (single uppercase letters or special keys)
          if (isInline && /^(Cmd|Ctrl|Alt|Shift|Enter|Tab|Esc|Delete|Backspace|[A-Z])$/.test(codeString)) {
            return (
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                {children}
              </kbd>
            );
          }

          // Regular inline code
          if (isInline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          // Block code with language label, copy button, and ID for quick-link navigation
          const codeId = `code-code-${++codeCounterRef.current}`;
          const language = match ? match[1] : 'code';
          const codeText = String(children).replace(/\n$/, '');

          return (
            <CodeBlockWithCopy
              id={codeId}
              language={language}
              code={codeText}
              className={className || ''}
              children={children}
            />
          );
        },
        // Enhanced blockquotes for callouts with ID for quick-link navigation and serif font
        blockquote: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
          const content = String(children);
          const emojiMatch = content.match(/^(ℹ️|⚠️|✅|❌|💡|📝|🔥|⭐|🎯|📌|💭|🚀|📚)/);

          if (emojiMatch) {
            const calloutId = `note-callout-${++calloutCounterRef.current}`;
            const emoji = emojiMatch[1];
            const typeMap: Record<string, string> = {
              'ℹ️': 'info',
              '⚠️': 'warning',
              '✅': 'success',
              '❌': 'error',
              '💡': 'tip',
              '📝': 'note',
              '🔥': 'important',
              '⭐': 'featured',
              '🎯': 'focus',
              '📌': 'pin',
              '💭': 'thought',
              '🚀': 'launch',
              '📚': 'reference',
            };
            const type = typeMap[emoji] || 'info';
            const colorMap: Record<string, string> = {
              'info': 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50',
              'warning': 'border-yellow-500 bg-yellow-50/80 dark:bg-yellow-950/50',
              'success': 'border-green-500 bg-green-50/80 dark:bg-green-950/50',
              'error': 'border-red-500 bg-red-50/80 dark:bg-red-950/50',
              'tip': 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50',
              'note': 'border-gray-500 bg-gray-50/80 dark:bg-gray-950/50',
              'important': 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/50',
              'featured': 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/50',
              'focus': 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50',
              'pin': 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/50',
              'thought': 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/50',
              'launch': 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50',
              'reference': 'border-slate-500 bg-slate-50/80 dark:bg-slate-950/50',
            };

            return (
              <blockquote
                id={calloutId}
                className={`font-serif border-l-4 p-5 my-6 scroll-mt-20 text-lg md:text-xl leading-relaxed rounded-r-lg shadow-sm ${colorMap[type]}`}
                {...props}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1">{children}</div>
                </div>
              </blockquote>
            );
          }

          return (
            <blockquote
              className="font-serif border-l-4 border-blue-500 dark:border-blue-400 pl-6 pr-4 py-4 my-6 italic text-lg md:text-xl text-gray-800 dark:text-gray-200 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg shadow-sm"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        // Enhanced list items for checklist detection
        li: ({ children, ...props }: any) => {
          // Check if this is a checklist item (contains checkbox input)
          const hasCheckbox = props.className?.includes('task-list-item');
          // If checklist, wrap checkbox with a label for accessibility
          if (hasCheckbox) {
            // Find the checkbox input and text
            let checkbox = null;
            let labelText = '';
            React.Children.forEach(children, (child) => {
              if (child && child.type === 'input' && child.props.type === 'checkbox') {
                checkbox = child;
              } else if (typeof child === 'string') {
                labelText += child;
              } else if (child && child.props && child.props.children) {
                labelText += child.props.children;
              }
            });
            // Generate unique id for checkbox
            const checkboxId = `task-checkbox-${Math.random().toString(36).substr(2, 9)}`;
            return (
              <li className="task-list-item" {...props}>
                <label htmlFor={checkboxId}>
                  {checkbox && React.cloneElement(checkbox, { id: checkboxId })}
                  <span>{labelText}</span>
                </label>
              </li>
            );
          }
          return (
            <li className="leading-[1.8] pl-2" {...props}>
              {children}
            </li>
          );
        },
        // Enhanced unordered list for checklist styling with serif font
        ul: ({ children, ...props }: any) => {
          const isTaskList = props.className?.includes('contains-task-list');

          // Generate ID for checklist groups
          let checklistId = '';
          if (isTaskList) {
            checklistId = `chk-checklist-${++checklistCounterRef.current}`;
          }

          return (
            <ul
              id={isTaskList ? checklistId : undefined}
              className={isTaskList ? 'contains-task-list list-none pl-0 my-6 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-900/50 scroll-mt-20' : 'font-serif my-8 space-y-4 text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200 list-disc list-outside ml-6 md:ml-8 tracking-wide'}
              {...props}
            >
              {children}
            </ul>
          );
        },
        // Video component for HTML5 videos
        video: ({ node, src, ...props }: any) => (
          <BlogVideo src={src} {...props} />
        ),
        // Iframe component for YouTube/Vimeo embeds
        iframe: ({ node, src, ...props }: any) => (
          <BlogIframe src={src} {...props} />
        ),
        // Support for div elements with text alignment classes
        div: ({ node, className, ...props }: any) => {
          // Preserve text alignment classes and other utility classes
          const alignClass = className?.match(/text-(left|right|center|justify)/)?.[0] || '';
          const videoWrapper = className?.includes('video-wrapper');

          if (videoWrapper) {
            return <div className="video-wrapper my-6" {...props} />;
          }

          return <div className={alignClass ? alignClass : className} {...props} />;
        },
      } as any}
    >
        {validationResult.transformedContent}
      </ReactMarkdown>
    </div>
  );
}


