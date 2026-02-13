'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent, useMemo, useCallback, useEffect, memo, createElement, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import remarkSmartypants from 'remark-smartypants';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { MarkdownToolbar } from './markdown-toolbar';
import { TableOfContents } from './table-of-contents';
import { MusicPlayer } from './music-player';

// Spoiler/Hidden Text component - click to reveal
function SpoilerText({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`inline-block px-2 py-0.5 rounded cursor-pointer transition-all ${
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
      <div className="my-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
          {url}
        </a>
      </div>
    );
  }
  
  return (
    <div className="my-6 flex justify-center">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={url} target="_blank" rel="noopener noreferrer">View Tweet</a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
    </div>
  );
}

// Enhanced Video component for HTML5 video playback
function EnhancedVideo({ src, controls = true, className, ...props }: any) {
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  return (
    <div className="relative w-full my-6">
      {videoLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse min-h-[300px]">
          <div className="text-sm text-gray-400 dark:text-gray-500">Loading video...</div>
        </div>
      )}
      {videoError ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-5xl mb-2">🎬</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <div className="font-medium mb-1">Video failed to load</div>
            <div className="text-xs break-all">{src}</div>
          </div>
        </div>
      ) : (
        <video
          controls={controls}
          className={`w-full rounded-lg shadow-lg ${videoLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => {
            setVideoLoading(false);
            setVideoError(true);
          }}
          preload="metadata"
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
function EnhancedIframe({ src, className, width, height, ...props }: any) {
  const iframeWidth = width || '100%';
  const iframeHeight = height || '100%';
  const containerClass = `video-wrapper my-6 relative ${height ? '' : 'aspect-video'}`;
  const iframeClass = `rounded-lg shadow-lg ${height ? '' : 'absolute inset-0 w-full h-full'} ${className || ''}`;

  return (
    <div className={containerClass}>
      <iframe
        src={src}
        width={iframeWidth}
        height={iframeHeight}
        className={iframeClass}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        {...props}
      />
    </div>
  );
}

// Enhanced Image component with loading, error states, size, and alignment controls
function EnhancedImage({ src, alt, className, ...props }: any) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Parse alignment from className or props
  const align = props.align || 
    (className?.includes('float-right') || className?.includes('align-right') ? 'right' : 
     className?.includes('float-left') || className?.includes('align-left') ? 'left' : 
     className?.includes('align-center') ? 'center' : 'center');
  
  const isFloatRight = align === 'right';
  const isFloatLeft = align === 'left';
  const isCentered = align === 'center' || (!isFloatRight && !isFloatLeft);
  
  // Parse size from className
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
  
  const baseClasses = "rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl";
  
  // Alignment classes
  let alignmentClasses = '';
  if (isFloatRight) {
    alignmentClasses = `float-right ml-4 mb-4 ${sizeClasses}`;
  } else if (isFloatLeft) {
    alignmentClasses = `float-left mr-4 mb-4 ${sizeClasses}`;
  } else if (isFullWidth) {
    alignmentClasses = `block w-full my-8`;
  } else {
    alignmentClasses = `block mx-auto my-8 ${sizeClasses}`;
  }
  
  return (
    <div className={`relative ${isFloatRight || isFloatLeft ? '' : 'w-full'} ${imageLoading ? 'min-h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' : ''}`}>
      {imageLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-gray-400 dark:text-gray-500">Loading image...</div>
        </div>
      )}
      {imageError ? (
        <div className={`${baseClasses} ${alignmentClasses} border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 flex flex-col items-center justify-center min-h-[200px]`}>
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <div className="font-medium mb-1">Image failed to load</div>
            <div className="text-xs break-all">{src}</div>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || 'Blog image'}
          className={`${baseClasses} ${alignmentClasses} ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

export interface LiveMarkdownEditorHandle {
  insertAtCursor: (text: string, wrap?: { prefix: string; suffix: string }) => void;
}

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  galleryImages?: Array<{ url: string; favorite: boolean }>;
  onInsertImage?: () => void;
  title?: string;
  onFormat?: (formatted: string) => void;
  className?: string;
}

// Hoisted remark plugin for custom syntax — stable reference, no re-creation per render
function remarkCustomSyntax() {
  return (tree: any) => {
    const { visit } = require('unist-util-visit');
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null || !node.value) return;
      let value = node.value;
      value = value.replace(/==(.*?)==/g, '<mark>$1</mark>');
      value = value.replace(/\|\|(.*?)\|\|/g, '<span data-spoiler="true">$1</span>');
      if (value !== node.value) {
        parent.children[index] = { type: 'html', value };
      }
    });
    visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null) return;
      const children = node.children || [];
      if (children.length === 1 && children[0].type === 'link') {
        const href = children[0].url || '';
        if (href.includes('twitter.com') || href.includes('x.com')) {
          parent.children[index] = { type: 'html', value: `<div data-twitter-embed="${href}"></div>` };
        }
      }
    });
  };
}

// Stable plugin arrays — never recreated between renders
const REMARK_PLUGINS = [remarkGfm, remarkMath, remarkSmartypants, remarkCustomSyntax];
const REHYPE_PLUGINS = [rehypeRaw, rehypeKatex, rehypeHighlight];

// Memoized markdown preview component to prevent re-renders
const MarkdownPreview = memo(({ content, inline = false }: { content: string; inline?: boolean }) => {
  return (
    <div className="prose prose-base dark:prose-invert max-w-2xl mx-auto">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          h1: ({ node, id, children, ...props }: any) => (
            <h1 id={id} className="text-3xl font-bold mb-4 text-gray-900 dark:text-white group relative" {...props}>
              <a href={`#${id}`} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400">#</a>
              {children}
            </h1>
          ),
          h2: ({ node, id, children, ...props }: any) => (
            <h2 id={id} className="text-2xl font-bold mb-3 mt-6 text-gray-900 dark:text-white group relative pl-6" {...props}>
              <a href={`#${id}`} className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400">#</a>
              {children}
            </h2>
          ),
          h3: ({ node, id, children, ...props }: any) => (
            <h3 id={id} className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white group relative pl-6" {...props}>
              <a href={`#${id}`} className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400">#</a>
              {children}
            </h3>
          ),
          p: ({ node, children, ...props }: any) => {
            const childrenText = String(children || '');
            if (childrenText.trim() === '[TOC]') {
              return inline ? 
                <TableOfContents content={content} inline={true} /> : 
                <div className="text-xs text-gray-500 dark:text-gray-400 italic my-4">📑 Table of Contents will appear here on published post</div>;
            }
            return <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>{children}</p>;
          },
          strong: ({ node, ...props }: any) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          em: ({ node, ...props }: any) => <em className="italic text-gray-800 dark:text-gray-200" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>{children}</code>
            );
          },
          pre: ({ node, ...props }: any) => (
            <pre className="mb-4 p-4 rounded-lg bg-gray-900 dark:bg-gray-950 overflow-x-auto" {...props} />
          ),
          blockquote: ({ node, ...props }: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-gray-700 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-r" {...props} />
          ),
          ul: ({ node, ...props }: any) => <ul className="mb-4 ml-6 list-disc space-y-2 marker:text-blue-500 dark:marker:text-blue-400" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="mb-4 ml-6 list-decimal space-y-2 marker:text-blue-500 dark:marker:text-blue-400" {...props} />,
          li: ({ node, ...props }: any) =>
            createElement('li', {
              className: 'text-gray-700 dark:text-gray-300 leading-relaxed',
              ...props,
            }),
          table: ({ node, ...props }: any) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }: any) => (
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900" {...props} />
          ),
          tbody: ({ node, ...props }: any) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props} />
          ),
          tr: ({ node, ...props }: any) => (
            <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors" {...props} />
          ),
          th: ({ node, ...props }: any) => (
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />
          ),
          td: ({ node, ...props }: any) => (
            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap" {...props} />
          ),
          a: ({ node, ...props }: any) => (
            <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          img: ({ node, src, alt, className, ...props }: any) => (
            <EnhancedImage src={src} alt={alt} className={className} {...props} />
          ),
          video: ({ node, src, ...props }: any) => (
            <EnhancedVideo src={src} {...props} />
          ),
          iframe: ({ node, src, ...props }: any) => (
            <EnhancedIframe src={src} {...props} />
          ),
          mark: ({ node, ...props }: any) => (
            <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-gray-900 dark:text-yellow-100 px-1 rounded" {...props} />
          ),
          u: ({ node, ...props }: any) => (
            <u className="underline decoration-2 decoration-blue-500 dark:decoration-blue-400 underline-offset-2" {...props} />
          ),
          span: ({ node, ...props }: any) => {
            // Handle spoiler text
            if (props['data-spoiler'] === 'true') {
              return <SpoilerText>{props.children}</SpoilerText>;
            }
            return <span {...props} />;
          },
          div: ({ node, className, ...props }: any) => {
            // Handle Twitter embeds
            if (props['data-twitter-embed']) {
              return <TwitterEmbed url={props['data-twitter-embed']} />;
            }
            // Preserve text alignment classes
            const alignClass = className?.match(/text-(left|right|center|justify)/)?.[0] || '';
            return <div className={alignClass ? alignClass : className} {...props} />;
          },
          music: ({ node, src, title, artist, ...props }: any) => (
            <MusicPlayer 
              src={src} 
              title={title} 
              artist={artist} 
              {...props} 
            />
          ),
        } as any}
      >
        {content || (inline ? '*No content yet. Start writing in Edit mode!*' : '*Start typing to see live preview...*')}
      </ReactMarkdown>
    </div>
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export const LiveMarkdownEditor = forwardRef<LiveMarkdownEditorHandle, LiveMarkdownEditorProps>(function LiveMarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  galleryImages,
  onInsertImage,
  title,
  onFormat,
  className = '',
}, ref) {
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('split');
  const [syncScroll, setSyncScroll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [previewValue, setPreviewValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const parentSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value);
    setPreviewValue(value);
  }, [value]);

  // Debounce preview updates to avoid re-rendering markdown on every keystroke
  const updatePreview = useCallback((newValue: string) => {
    if (previewSyncTimerRef.current) {
      clearTimeout(previewSyncTimerRef.current);
    }
    previewSyncTimerRef.current = setTimeout(() => {
      setPreviewValue(newValue);
    }, 500);
  }, []);

  // Debounce parent onChange to reduce parent re-renders
  const syncWithParent = useCallback((newValue: string) => {
    if (parentSyncTimerRef.current) {
      clearTimeout(parentSyncTimerRef.current);
    }
    parentSyncTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300); // 300ms debounce for parent sync
  }, [onChange]);

  // Handle value changes with debounced preview and parent sync
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue); // Update immediately for typing responsiveness
    updatePreview(newValue); // Debounced preview update
    syncWithParent(newValue); // Debounced parent sync
  }, [updatePreview, syncWithParent]);

  // Strip heading IDs for preview (they won't show to readers on the actual blog)
  // Keep [TOC] marker in place - it will be rendered inline by custom component
  const getPreviewContent = useCallback((content: string) => {
    let processed = content;
    
    // Remove {#id} from headings - these are for anchor links, not visible to readers
    processed = processed.replace(/\s*\{#[a-z0-9-]+\}/gi, '');
    
    // Convert ==highlight== to <mark>highlight</mark>
    processed = processed.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    
    // Convert ||spoiler|| to custom spoiler component
    processed = processed.replace(/\|\|([^|]+)\|\|/g, '<span data-spoiler="true">$1</span>');
    
    // Convert <u>text</u> stays as is (rehypeRaw handles it)
    
    // Detect standalone Twitter URLs and convert to embeds
    processed = processed.replace(
      /^https?:\/\/(twitter\.com|x\.com)\/[^\s\/]+\/status\/\d+(?:\?[^\s]*)?$/gm,
      (url) => `<div data-twitter-embed="${url}"></div>`
    );
    
    return processed;
  }, []);

  // Memoize the processed preview content
  const processedPreviewContent = useMemo(() => {
    return getPreviewContent(previewValue);
  }, [previewValue, getPreviewContent]);

  // Insert text at cursor position, or wrap selection if wrap option provided
  const insertAtCursor = (text: string, wrap?: { prefix: string; suffix: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const before = localValue.substring(0, start);
    const after = localValue.substring(end);

    // If wrap provided and there's selection: wrap the selection instead of replacing
    if (wrap && selectedText) {
      const newValue = before + wrap.prefix + selectedText + wrap.suffix + after;
      const scrollTop = textarea.scrollTop;
      handleChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + wrap.prefix.length, end + wrap.prefix.length);
      }, 0);
      return;
    }

    const newValue = before + text + after;
    const scrollTop = textarea.scrollTop;
    handleChange(newValue);

    // Set cursor position after inserted text and restore scroll
    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  useImperativeHandle(ref, () => ({
    insertAtCursor,
  }), [insertAtCursor]);

  // Auto-pair brackets, quotes, and markdown syntax
  const handleAutoPair = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = localValue.substring(0, start);
    const after = localValue.substring(end);
    const selectedText = localValue.substring(start, end);

    // Auto-pair mappings
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
      '*': '*',
      '_': '_',
      '**': '**',
      '~~': '~~',
    };

    // If there's a selection, wrap it
    if (selectedText && pairs[e.key]) {
      e.preventDefault();
      const pair = pairs[e.key];
      handleChange(before + e.key + selectedText + pair + after);
      setTimeout(() => {
        textarea.setSelectionRange(start + e.key.length, end + e.key.length);
      }, 0);
      return true;
    }

    // Auto-pair if no selection
    if (!selectedText && pairs[e.key]) {
      e.preventDefault();
      const pair = pairs[e.key];
      handleChange(before + e.key + pair + after);
      setTimeout(() => {
        textarea.setSelectionRange(start + e.key.length, start + e.key.length);
      }, 0);
      return true;
    }

    // Auto-close code blocks: when user types opening ```, insert newlines + closing ```
    if (e.key === '`' && before.slice(-3) === '```') {
      e.preventDefault();
      const closing = '\n\n```';
      handleChange(before + closing + after);
      setTimeout(() => {
        const newPos = start + closing.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
      return true;
    }

    return false;
  };

  // Smart paste handler - auto-format pasted content
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;

    // Detect if pasted content is a URL
    const urlPattern = /^https?:\/\/[^\s]+$/;
    if (urlPattern.test(pastedText.trim())) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = localValue.substring(0, start);
      const after = localValue.substring(end);

      const trimmedUrl = pastedText.trim();
      const urlWithoutQuery = trimmedUrl.split('?')[0];
      const isImageUrl = /\.(png|jpe?g|gif|webp|svg)$/i.test(urlWithoutQuery);

      if (isImageUrl) {
        // Auto-convert image URL to markdown image so it renders inline
        // Extract filename for better alt text
        const filename = trimmedUrl.split('/').pop()?.split('?')[0] || 'image';
        const altText = filename.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '') || 'Image';
        const markdownImage = `![${altText}](${trimmedUrl})`;
        handleChange(before + markdownImage + after);
        setTimeout(() => {
          textarea.focus();
          const newPos = start + markdownImage.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        // Auto-convert URL to markdown link
        const linkText = trimmedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
        const markdownLink = `[${linkText}](${trimmedUrl})`;
        handleChange(before + markdownLink + after);

        setTimeout(() => {
          textarea.focus();
          const newPos = start + markdownLink.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }

      setTimeout(() => {
        textarea.focus();
      }, 0);
      return;
    }

    // Auto-format headings if pasted text looks like a heading
    const headingPattern = /^([A-Z][A-Z\s]+)$/;
    if (headingPattern.test(pastedText.trim()) && pastedText.length < 100) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = localValue.substring(0, start);
      const after = localValue.substring(end);
      
      // Check if we're at the start of a line or after a blank line
      const lineStart = localValue.lastIndexOf('\n', start - 1) + 1;
      const lineBefore = localValue.substring(lineStart, start).trim();
      
      if (!lineBefore || lineBefore === '') {
        // Convert to heading
        const heading = `## ${pastedText}\n\n`;
        handleChange(before + heading + after);
        setTimeout(() => {
          textarea.focus();
          const newPos = start + heading.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Try auto-pairing first
    if (handleAutoPair(e)) {
      return;
    }

    // Bold: Ctrl/Cmd + B
    if (cmdOrCtrl && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**', '**');
      return;
    }

    // Italic: Ctrl/Cmd + I
    if (cmdOrCtrl && e.key === 'i') {
      e.preventDefault();
      wrapSelection('*', '*');
      return;
    }

    // Code: Ctrl/Cmd + `
    if (cmdOrCtrl && e.key === '`') {
      e.preventDefault();
      wrapSelection('`', '`');
      return;
    }

    // Heading shortcuts: Ctrl/Cmd + 1-6
    if (cmdOrCtrl && /^[1-6]$/.test(e.key)) {
      e.preventDefault();
      const level = parseInt(e.key);
      const prefix = '#'.repeat(level);
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const lineStart = localValue.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = localValue.indexOf('\n', start);
      const currentLine = localValue.substring(lineStart, lineEnd === -1 ? localValue.length : lineEnd);
      const lineText = currentLine.trim();
      
      if (lineText && !lineText.startsWith('#')) {
        // Convert current line to heading
        const before = localValue.substring(0, lineStart);
        const after = localValue.substring(lineEnd === -1 ? localValue.length : lineEnd);
        const newLine = `${prefix} ${lineText}\n`;
        handleChange(before + newLine + after);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
        }, 0);
      } else {
        // Insert new heading
        insertAtCursor(`\n${prefix} `);
      }
      return;
    }

    // Tab: Indent list
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = localValue.lastIndexOf('\n', start - 1) + 1;
      const currentLine = localValue.substring(lineStart, start);

      if (e.shiftKey) {
        // Unindent
        if (currentLine.startsWith('  ')) {
          const before = localValue.substring(0, lineStart);
          const after = localValue.substring(lineStart);
          handleChange(before + after.replace(/^  /, ''));
          setTimeout(() => {
            textarea.setSelectionRange(start - 2, start - 2);
          }, 0);
        }
      } else {
        // Indent
        insertAtCursor('  ');
      }
      return;
    }

    // Auto-list continuation
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = localValue.lastIndexOf('\n', start - 1) + 1;
      const currentLine = localValue.substring(lineStart, start);
      const lineEnd = localValue.indexOf('\n', start);
      const fullLine = localValue.substring(lineStart, lineEnd === -1 ? localValue.length : lineEnd);

      // Check if current line is a list item
      const bulletMatch = fullLine.match(/^(\s*)([-*+])\s(.+)$/);
      const numberedMatch = fullLine.match(/^(\s*)(\d+)\.\s(.+)$/);
      const checklistMatch = fullLine.match(/^(\s*)([-*+])\s\[([ x])\]\s(.+)$/);

      if (checklistMatch) {
        e.preventDefault();
        const [, indent, bullet, checked, content] = checklistMatch;
        // If line is empty, create new unchecked item
        if (!content.trim()) {
          insertAtCursor(`\n${indent}${bullet} [ ] `);
        } else {
          insertAtCursor(`\n${indent}${bullet} [ ] `);
        }
      } else if (bulletMatch) {
        e.preventDefault();
        const [, indent, bullet, content] = bulletMatch;
        // If line is empty, don't continue list
        if (!content.trim()) {
          // Remove the empty list item
          const before = localValue.substring(0, lineStart);
          const after = localValue.substring(lineEnd === -1 ? localValue.length : lineEnd + 1);
          handleChange(before + after);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          insertAtCursor(`\n${indent}${bullet} `);
        }
      } else if (numberedMatch) {
        e.preventDefault();
        const [, indent, num, content] = numberedMatch;
        // If line is empty, don't continue list
        if (!content.trim()) {
          // Remove the empty list item
          const before = localValue.substring(0, lineStart);
          const after = localValue.substring(lineEnd === -1 ? localValue.length : lineEnd + 1);
          handleChange(before + after);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          const nextNum = parseInt(num) + 1;
          insertAtCursor(`\n${indent}${nextNum}. `);
        }
      } else if (fullLine.trim().startsWith('>')) {
        // Continue blockquote
        e.preventDefault();
        const quoteMatch = fullLine.match(/^(\s*>+\s*)/);
        if (quoteMatch) {
          insertAtCursor(`\n${quoteMatch[1]}`);
        } else {
          insertAtCursor('\n> ');
        }
      }
    }

    // Smart backspace - remove paired characters together
    if (e.key === 'Backspace') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start === end && start > 0) {
        const before = localValue.substring(0, start);
        const after = localValue.substring(start);
        const charBefore = before.slice(-1);
        const charAfter = after.charAt(0);
        
        const pairs: Record<string, string> = {
          '(': ')',
          '[': ']',
          '{': '}',
          '"': '"',
          "'": "'",
          '`': '`',
        };
        
        // If we're deleting an opening bracket and the next char is its closing pair, delete both
        if (pairs[charBefore] === charAfter) {
          e.preventDefault();
          handleChange(before.slice(0, -1) + after.substring(1));
          setTimeout(() => {
            textarea.setSelectionRange(start - 1, start - 1);
          }, 0);
        }
      }
    }
  };

  // Wrap selected text with prefix and suffix
  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const before = localValue.substring(0, start);
    const after = localValue.substring(end);

    const newValue = before + prefix + selectedText + suffix + after;
    const scrollTop = textarea.scrollTop;
    handleChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  // Scroll synchronization functions
  const syncScrollFromTextarea = useCallback(() => {
    if (mode !== 'split' || !syncScroll) return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    // Clear any pending sync
    if (scrollSyncTimerRef.current) {
      clearTimeout(scrollSyncTimerRef.current);
    }

    // Debounce scroll sync
    scrollSyncTimerRef.current = setTimeout(() => {
      const textareaHeight = textarea.scrollHeight - textarea.clientHeight;
      const previewHeight = preview.scrollHeight - preview.clientHeight;
      
      if (textareaHeight > 0 && previewHeight > 0) {
        const scrollPercentage = textarea.scrollTop / textareaHeight;
        preview.scrollTop = scrollPercentage * previewHeight;
      }
    }, 50);
  }, [mode, syncScroll]);

  const syncScrollFromPreview = useCallback(() => {
    if (mode !== 'split' || !syncScroll) return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    // Clear any pending sync
    if (scrollSyncTimerRef.current) {
      clearTimeout(scrollSyncTimerRef.current);
    }

    // Debounce scroll sync
    scrollSyncTimerRef.current = setTimeout(() => {
      const textareaHeight = textarea.scrollHeight - textarea.clientHeight;
      const previewHeight = preview.scrollHeight - preview.clientHeight;
      
      if (textareaHeight > 0 && previewHeight > 0) {
        const scrollPercentage = preview.scrollTop / previewHeight;
        textarea.scrollTop = scrollPercentage * textareaHeight;
      }
    }, 50);
  }, [mode, syncScroll]);

  // Manual one-time sync from editor to preview
  const handleManualSync = useCallback(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    const textareaHeight = textarea.scrollHeight - textarea.clientHeight;
    const previewHeight = preview.scrollHeight - preview.clientHeight;
    
    if (textareaHeight > 0 && previewHeight > 0) {
      const scrollPercentage = textarea.scrollTop / textareaHeight;
      preview.scrollTo({
        top: scrollPercentage * previewHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Handle click to sync scroll position
  const handleTextareaClick = useCallback(() => {
    if (mode !== 'split') return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    // Calculate line number from cursor position
    const textBeforeCursor = localValue.substring(0, textarea.selectionStart);
    const lineNumber = textBeforeCursor.split('\n').length;
    
    // Estimate scroll position based on line number
    const totalLines = localValue.split('\n').length;
    const lineHeight = 24; // Approximate line height in pixels
    const estimatedScrollTop = (lineNumber / totalLines) * (textarea.scrollHeight - textarea.clientHeight);
    
    // Smooth scroll to position
    textarea.scrollTo({
      top: estimatedScrollTop,
      behavior: 'smooth'
    });
    
    // Sync with preview after a short delay
    setTimeout(syncScrollFromTextarea, 300);
  }, [mode, localValue, syncScrollFromTextarea]);

  const handlePreviewClick = useCallback(() => {
    if (mode !== 'split') return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    // Sync current preview scroll to textarea
    syncScrollFromPreview();
  }, [mode, syncScroll, syncScrollFromPreview]);


  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[60] flex flex-col bg-gray-950/95 dark:bg-black/95 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-hidden h-screen'
          : `flex flex-col bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-800/50 ${className}`
      }
    >
      {/* Toolbar */}
      <div
        className={`sticky top-0 z-10 mb-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 backdrop-blur-sm -mx-4 px-4 pt-2 -mt-4 ${
          isFullscreen ? 'bg-gray-950/95 dark:bg-black/95' : 'bg-gray-50/95 dark:bg-gray-900/95'
        }`}
      >
        <MarkdownToolbar
          onInsert={insertAtCursor}
          onInsertImage={onInsertImage}
          galleryImages={galleryImages}
          content={localValue}
          title={title}
          onFormat={onFormat}
        />
        
        {/* View Mode + Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mode === 'write'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Edit mode - raw markdown"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mode === 'split'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Split view - edit and preview side by side"
            >
              ⚡ Live
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Preview mode - see rendered output"
            >
              👁️ Preview
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="px-2.5 py-1 text-[11px] font-medium rounded border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            title={isFullscreen ? 'Exit full screen editor' : 'Open full screen editor'}
          >
            {isFullscreen ? '⤢ Exit Full' : '⤢ Full Screen'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className={`${isFullscreen ? 'mt-2 [&]:h-[calc(100vh-140px)] [&]:max-h-[calc(100vh-140px)]' : '[&]:h-[70vh] [&]:max-h-[70vh]'} overflow-hidden stable-scroll`}
      >
        {mode === 'write' && (
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full h-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm md:text-[15px] leading-relaxed overflow-auto"
            spellCheck="true"
          />
        )}

        {mode === 'preview' && (
          <div className="w-full h-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 overflow-y-auto overflow-x-hidden stable-scroll">
            <MarkdownPreview content={processedPreviewContent} inline={true} />
          </div>
        )}

        {mode === 'split' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full overflow-hidden">
            {/* Editor Side */}
            <div className="flex flex-col min-w-0 h-full overflow-hidden">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">
                  ✏️ Markdown Source
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                    title="Sync preview scroll to editor position"
                  >
                    ⇅ Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncScroll(!syncScroll)}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                      syncScroll
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={syncScroll ? 'Auto-sync is ON — click to disable' : 'Auto-sync is OFF — click to enable'}
                  >
                    {syncScroll ? '🔗 Auto-Sync ON' : '🔓 Auto-Sync OFF'}
                  </button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onScroll={syncScrollFromTextarea}
                onClick={handleTextareaClick}
                placeholder={placeholder}
                className="flex-1 min-h-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm md:text-[15px] leading-relaxed overflow-auto"
                spellCheck="true"
              />
            </div>

            {/* Preview Side */}
            <div className="flex flex-col min-w-0 h-full overflow-hidden">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-1 flex-shrink-0">
                👁️ Live Preview
              </span>
              <div
                ref={previewRef}
                onScroll={syncScrollFromPreview}
                onClick={handlePreviewClick}
                className="flex-1 min-h-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 overflow-y-auto overflow-x-hidden stable-scroll cursor-pointer"
              >
                <MarkdownPreview content={processedPreviewContent} inline={false} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help - Collapsible */}
      {!isFullscreen && (
        <details className="mt-2 group">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 list-none flex items-center gap-1">
            <span>⌨️</span>
            <span>Keyboard Shortcuts</span>
            <span className="text-[10px] opacity-50 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>💡 <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl/Cmd+B</kbd> Bold</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl/Cmd+I</kbd> Italic</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl/Cmd+1-6</kbd> Heading</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Tab</kbd> Indent</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Shift+Tab</kbd> Unindent</span>
            <span className="text-green-600 dark:text-green-400">✨ Auto-pairing • Smart paste • Auto-lists</span>
          </div>
        </details>
      )}
    </div>
  );
});
