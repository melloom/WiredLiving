'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { generateHeadingId } from '@/lib/utils';

/**
 * Content Quick Links - Auto-detects interactive elements in blog posts
 * and displays them as clickable/hyperlinked items
 */

interface QuickLinkItem {
  id: string;
  type: 'heading' | 'table' | 'checklist' | 'chart' | 'code' | 'image' | 'callout' | 'link-list';
  text: string;
  level?: number; // For headings
  count?: number; // For checklists (number of items)
  language?: string; // For code blocks
}

interface ContentQuickLinksProps {
  content: string;
  onLinkClick?: () => void;
}

// Icons for different content types
const ContentTypeIcons = {
  heading: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  table: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  checklist: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  chart: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  code: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  image: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  callout: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'link-list': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

// Type labels for display
const TypeLabels: Record<QuickLinkItem['type'], string> = {
  heading: 'Section',
  table: 'Table',
  checklist: 'Checklist',
  chart: 'Chart',
  code: 'Code',
  image: 'Image',
  callout: 'Note',
  'link-list': 'Links',
};

// Type colors for visual distinction
const TypeColors: Record<QuickLinkItem['type'], string> = {
  heading: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  table: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
  checklist: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  chart: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
  code: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30',
  image: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30',
  callout: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
  'link-list': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
};

/**
 * Generate a URL-safe ID from text with optional prefix
 * Uses shared function for consistency with MDX headings
 */
function generateId(text: string, prefix: string = ''): string {
  const { id } = generateHeadingId(text);
  return prefix ? `${prefix}-${id}` : id;
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

/**
 * Extract all quick-linkable items from content
 */
function extractQuickLinks(content: string): QuickLinkItem[] {
  const items: QuickLinkItem[] = [];
  const usedIds = new Set<string>();

  const getUniqueId = (base: string, prefix: string = ''): string => {
    let id = generateId(base, prefix);
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${generateId(base, prefix)}-${counter}`;
      counter++;
    }
    usedIds.add(id);
    return id;
  };

  // 1. Extract headings (H2 and H3 for quick links - H1 is usually the title)
  // Capture optional manual ID if provided (e.g., `## Heading {#my-id}`)
  const headingRegex = /^(#{2,3})\s+(.+?)(?:\s*\{#([^}]+)\})?$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const fullText = match[2].trim();
    const manualId = match[3]?.trim();
    // Clean all markdown syntax from text
    const text = cleanMarkdown(fullText);
    // Honor manual ID if provided, otherwise generate a consistent ID
    // IMPORTANT: Use generateId directly (not getUniqueId) to match MDXContent's heading ID generation
    const id = manualId || generateId(text);
    items.push({
      id,
      type: 'heading',
      text,
      level,
    });
  }

  // 2. Extract tables (detect markdown tables)
  const tableRegex = /\|[^\n]+\|\n\|[-:\s|]+\|\n((?:\|[^\n]+\|\n?)+)/g;
  let tableIndex = 0;
  while ((match = tableRegex.exec(content)) !== null) {
    tableIndex++;
    // Try to find a heading before the table for context
    const beforeTable = content.slice(0, match.index);
    const lastHeadingMatch = beforeTable.match(/^#{1,6}\s+(.+?)(?:\s*\{#[^}]+\})?$/m);
    let tableContext = `Table ${tableIndex}`;
    
    if (lastHeadingMatch) {
      const rawText = lastHeadingMatch[1].trim();
      const cleaned = cleanMarkdown(rawText);
      // Only use if it's reasonably short and doesn't look like SEO keywords
      if (cleaned.length < 50 && !cleaned.includes(',')) {
        tableContext = cleaned;
      }
    }
    
    // Count rows
    const rows = match[0].split('\n').filter(line => line.trim().startsWith('|')).length - 1; // -1 for header separator
    
    items.push({
      id: `tbl-table-${tableIndex}`, // Match MDXContent ID format
      type: 'table',
      text: `${tableContext} (${rows} rows)`,
      count: rows,
    });
  }

  // 3. Extract checklists (- [ ] or - [x] patterns)
  const checklistRegex = /(?:^|\n)((?:[-*]\s+\[[x ]\].+\n?)+)/gi;
  let checklistIndex = 0;
  while ((match = checklistRegex.exec(content)) !== null) {
    checklistIndex++;
    const checklistItems = match[1].match(/[-*]\s+\[[x ]\]/gi);
    const checkedItems = match[1].match(/[-*]\s+\[x\]/gi);
    const totalItems = checklistItems?.length || 0;
    const completedItems = checkedItems?.length || 0;
    
    // Find context from nearby heading
    const beforeChecklist = content.slice(0, match.index);
    const lastHeadingMatch = beforeChecklist.match(/#{1,6}\s+(.+?)(?:\s*\{#[^}]+\})?$/m);
    let context = `Checklist ${checklistIndex}`;
    
    if (lastHeadingMatch) {
      const rawText = lastHeadingMatch[1].trim();
      const cleaned = cleanMarkdown(rawText);
      // Only use if it's reasonably short and doesn't look like SEO keywords
      if (cleaned.length < 50 && !cleaned.includes(',')) {
        context = cleaned;
      }
    }

    items.push({
      id: `chk-checklist-${checklistIndex}`, // Match MDXContent ID format
      type: 'checklist',
      text: `${context} (${completedItems}/${totalItems})`,
      count: totalItems,
    });
  }

  // 4. Extract code blocks with language
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeIndex = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeIndex++;
    const language = match[1] || 'text';
    const codeContent = match[2].trim();
    
    // Try to get first meaningful line or comment as context
    const firstLine = codeContent.split('\n')[0].trim();
    let context = firstLine.slice(0, 40);
    if (context.startsWith('//') || context.startsWith('#') || context.startsWith('/*')) {
      context = context.replace(/^[/#*\s]+/, '').trim();
    }
    
    items.push({
      id: `code-code-${codeIndex}`, // Match MDXContent ID format
      type: 'code',
      text: cleanMarkdown(context || `Code block ${codeIndex}`),
      language,
    });
  }

  // 5. Extract images with alt text
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imageIndex = 0;
  while ((match = imageRegex.exec(content)) !== null) {
    imageIndex++;
    const altText = match[1].trim();
    const imageSrc = match[2].trim();
    
    // Generate ID matching MDXContent format: img-{sanitized-src}
    // Take first 20 chars of src, remove non-alphanumeric
    const imageId = `img-${imageSrc.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
    
    items.push({
      id: imageId, // Match MDXContent ID format
      type: 'image',
      text: cleanMarkdown(altText || `Image ${imageIndex}`),
    });
  }

  // 6. Extract callouts/blockquotes with emoji markers
  const calloutRegex = />\s*(ℹ️|⚠️|✅|❌|💡|📝|🔥|⭐|🎯|📌|💭|🚀|📚)\s*\*\*([^*]+)\*\*/g;
  let calloutIndex = 0;
  while ((match = calloutRegex.exec(content)) !== null) {
    calloutIndex++;
    const calloutType = cleanMarkdown(match[2].trim());
    
    items.push({
      id: `note-callout-${calloutIndex}`, // Match MDXContent ID format
      type: 'callout',
      text: calloutType,
    });
  }

  // 7. Extract numbered lists that look like step-by-step guides
  const numberedListRegex = /(?:^|\n)((?:\d+[\.\)]\s+.+\n?){3,})/g;
  let listIndex = 0;
  while ((match = numberedListRegex.exec(content)) !== null) {
    listIndex++;
    const listItems = match[1].match(/\d+[\.\)]/g);
    const totalItems = listItems?.length || 0;
    
    // Find context from nearby heading
    const beforeList = content.slice(0, match.index);
    const lastHeadingMatch = beforeList.match(/#{1,6}\s+(.+?)(?:\s*\{#[^}]+\})?$/m);
    let context = 'Steps';
    
    if (lastHeadingMatch) {
      const rawText = lastHeadingMatch[1].trim();
      const cleaned = cleanMarkdown(rawText);
      // Only use if it's reasonably short and doesn't look like SEO keywords
      if (cleaned.length < 50 && !cleaned.includes(',')) {
        context = cleaned;
      }
    }

    // Only add if it looks like a meaningful list (more than 3 items)
    if (totalItems >= 3) {
      items.push({
        id: `steps-list-${listIndex}`, // Match MDXContent ID format
        type: 'link-list',
        text: `${context} (${totalItems} steps)`,
        count: totalItems,
      });
    }
  }

  return items;
}

export function ContentQuickLinks({ content, onLinkClick }: ContentQuickLinksProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<QuickLinkItem['type']>>(new Set(['heading']));
  const rafRef = useRef<number | null>(null);
  
  // Extract quick links from content
  const quickLinks = useMemo(() => extractQuickLinks(content), [content]);
  
  // Group items by type
  const groupedLinks = useMemo(() => {
    const groups: Record<QuickLinkItem['type'], QuickLinkItem[]> = {
      heading: [],
      table: [],
      checklist: [],
      chart: [],
      code: [],
      image: [],
      callout: [],
      'link-list': [],
    };
    
    quickLinks.forEach(item => {
      groups[item.type].push(item);
    });
    
    return groups;
  }, [quickLinks]);

  // Count non-empty groups for display
  const activeGroups = useMemo(() => {
    return Object.entries(groupedLinks).filter(([, items]) => items.length > 0);
  }, [groupedLinks]);

  // Handle scroll to track active section with throttling
  useEffect(() => {
    const updateActiveSection = () => {
      const headingItems = quickLinks.filter(item => item.type === 'heading');
      const scrollPosition = window.scrollY + 150;

      for (let i = headingItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(headingItems[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(headingItems[i].id);
          break;
        }
      }
    };

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveSection();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [quickLinks]);

  // Toggle group expansion
  const toggleGroup = (type: QuickLinkItem['type']) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Scroll to element
  const scrollToElement = (id: string) => {
    onLinkClick?.();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  if (quickLinks.length === 0) {
    return null;
  }

  return (
    <div className="self-start max-h-[calc(100vh-7rem)] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg z-20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Links
          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
            {quickLinks.length} items
          </span>
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? 'Expand quick links' : 'Collapse quick links'}
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
      <>
      <div className="space-y-2">
        {activeGroups.map(([type, items]) => (
          <div key={type} className="rounded-lg overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(type as QuickLinkItem['type'])}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${TypeColors[type as QuickLinkItem['type']]} hover:opacity-80`}
            >
              {ContentTypeIcons[type as QuickLinkItem['type']]}
              <span>{TypeLabels[type as QuickLinkItem['type']]}</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-[10px]">
                  {items.length}
                </span>
                <svg
                  className={`w-3 h-3 transition-transform ${expandedTypes.has(type as QuickLinkItem['type']) ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            
            {/* Group items */}
            {expandedTypes.has(type as QuickLinkItem['type']) && (
              <nav className="mt-1 space-y-0.5 pl-2">
                {items.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToElement(item.id);
                    }}
                    className={`
                      block text-xs py-1.5 px-2.5 rounded-md transition-all truncate
                      ${item.type === 'heading' && item.level === 3 ? 'pl-5' : ''}
                      ${activeId === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                    `}
                    title={item.text}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.language && (
                        <span className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[9px] font-mono uppercase">
                          {item.language}
                        </span>
                      )}
                      <span className="truncate">{item.text}</span>
                    </span>
                  </a>
                ))}
              </nav>
            )}
          </div>
        ))}
      </div>
      
      {/* Quick stats footer */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-1.5">
          {activeGroups.slice(0, 4).map(([type, items]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TypeColors[type as QuickLinkItem['type']]}`}
            >
              {ContentTypeIcons[type as QuickLinkItem['type']]}
              {items.length}
            </span>
          ))}
          {activeGroups.length > 4 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              +{activeGroups.length - 4} more
            </span>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
