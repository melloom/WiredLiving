'use client';

import { getButtonTooltip } from '@/lib/markdown-support';
import { useToast } from '@/components/toast';

interface MarkdownToolbarProps {
  onInsert: (text: string, wrap?: { prefix: string; suffix: string }) => void;
  onInsertImage?: () => void;
  galleryImages?: Array<{ url: string; favorite: boolean }>;
  content?: string;
  title?: string;
  onFormat?: (formattedContent: string) => void;
}

export function MarkdownToolbar({ onInsert, onInsertImage, galleryImages, content, title, onFormat }: MarkdownToolbarProps) {
  const toast = useToast();
  const autoFormat = () => {
    if (!onFormat || !content) return;

    let textContent = content.trim();
    if (!textContent) return;

    const lines = textContent.split('\n');
    const formatted: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let inTable = false;
    let hasH1 = false;
    let codeBlockLanguage = '';
    let consecutiveBlankLines = 0;

    // Helper function to detect if line is a table row
    const isTableRow = (line: string): boolean => {
      return line.includes('|') && line.split('|').filter(Boolean).length >= 2;
    };

    // Helper function to detect table separator
    const isTableSeparator = (line: string): boolean => {
      return /^\|?[\s\-:]+\|[\s\-:|]+\|?$/.test(line);
    };

    // Helper to normalize table formatting
    const normalizeTableRow = (line: string): string => {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      return '| ' + cells.join(' | ') + ' |';
    };

    // DISABLED: Aggressive heading auto-detection was causing false positives
    // The autoFormatter should NOT convert regular text into headings automatically.
    // Users should decide what becomes a heading - not the formatter.
    const headingPatterns: RegExp[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      const nextLineEmpty = !nextLine || nextLine === '';

      // Handle empty lines with blank line limit (max 2 consecutive)
      if (!trimmed) {
        consecutiveBlankLines++;
        if (consecutiveBlankLines <= 2 && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        continue;
      }
      consecutiveBlankLines = 0;

      // Detect and preserve code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          // Extract language if specified
          codeBlockLanguage = trimmed.substring(3).trim();
          
          // Smart language detection if not specified
          if (!codeBlockLanguage && nextLine) {
            // Look at first line of code to guess language
            const firstCodeLine = nextLine.trim();
            if (firstCodeLine.startsWith('import ') || firstCodeLine.startsWith('require(')) codeBlockLanguage = 'javascript';
            else if (firstCodeLine.startsWith('from ') || firstCodeLine.startsWith('import ') || firstCodeLine.startsWith('def ')) codeBlockLanguage = 'python';
            else if (firstCodeLine.startsWith('function ') || firstCodeLine.match(/^(const|let|var)\s+/)) codeBlockLanguage = 'javascript';
            else if (firstCodeLine.match(/^(package|class|interface|enum)\s+/)) codeBlockLanguage = 'java';
            else if (firstCodeLine.match(/^(struct|func|var|let)\s+/)) codeBlockLanguage = 'swift';
            else if (firstCodeLine.startsWith('<?php')) codeBlockLanguage = 'php';
            else if (firstCodeLine.startsWith('#!/')) codeBlockLanguage = 'bash';
            else if (firstCodeLine.match(/^(curl|npm|yarn|npx)\s+/)) codeBlockLanguage = 'bash';
            else if (firstCodeLine.startsWith('SELECT ') || firstCodeLine.startsWith('INSERT ')) codeBlockLanguage = 'sql';
          }
          
          formatted.push(codeBlockLanguage ? `\`\`\`${codeBlockLanguage}` : '```');
        } else {
          formatted.push('```');
          if (!nextLineEmpty) {
            formatted.push('');
          }
          codeBlockLanguage = '';
        }
        continue;
      }

      // Don't format inside code blocks
      if (inCodeBlock) {
        formatted.push(line);
        continue;
      }

      // Detect and preserve HTML elements
      if (trimmed.match(/^<(details|summary|\/details|\/summary|div|section|article|aside)/i)) {
        formatted.push(trimmed);
        continue;
      }

      // Detect and preserve tables
      if (isTableRow(trimmed) || isTableSeparator(trimmed)) {
        if (!inTable) {
          inTable = true;
          if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
            formatted.push('');
          }
        }
        // Clean up table formatting if it's a data row
        if (!isTableSeparator(trimmed)) {
          formatted.push(normalizeTableRow(trimmed));
        } else {
          formatted.push(trimmed);
        }

        // Check if next line is not a table row to end table
        if (!isTableRow(nextLine) && !isTableSeparator(nextLine)) {
          inTable = false;
          if (!nextLineEmpty) {
            formatted.push('');
          }
        }
        continue;
      }

      // Preserve footnote definitions
      if (trimmed.match(/^\[\^[\w\d]+\]:\s/)) {
        formatted.push(trimmed);
        continue;
      }

      // Preserve definition lists
      if (trimmed.startsWith(':') && prevLine && prevLine.length > 0 && !prevLine.startsWith(':')) {
        formatted.push(trimmed);
        continue;
      }

      // Auto-fix common markdown patterns
      let processedLine = trimmed;

      // Fix bold: **text** or __text__ - normalize to **
      processedLine = processedLine.replace(/__([^_]+)__/g, '**$1**');

      // Fix italic: *text* or _text_ - normalize to *
      processedLine = processedLine.replace(/(?<!\\)_([^_]{1,})_(?!_)/g, '*$1*');

      // Fix strikethrough
      processedLine = processedLine.replace(/~~([^~]+)~~/g, '~~$1~~');

      // Fix inline code: `code` - ensure proper spacing
      processedLine = processedLine.replace(/`([^`]+)`/g, '`$1`');

      // Fix links: [text](url) - ensure no extra spaces
      processedLine = processedLine.replace(/\[\s*([^\]]+?)\s*\]\(\s*([^)]+?)\s*\)/g, '[$1]($2)');

      // Fix images: ![alt](url)
      processedLine = processedLine.replace(/!\[\s*([^\]]*?)\s*\]\(\s*([^)]+?)\s*\)/g, '![$1]($2)');

      // Fix footnote references - ensure proper formatting
      processedLine = processedLine.replace(/\[\^\s*([\w\d]+)\s*\]/g, '[^$1]');

      // Remove extra spaces (normalize multiple spaces to single)
      processedLine = processedLine.replace(/  +/g, ' ');

      // Fix common URL wrapping - detect bare URLs not in links
      // http(s)://... that's not already in a markdown link
      if (processedLine.match(/https?:\/\//) && !processedLine.match(/\]\(https?:\/\//)) {
        // Only wrap if not already part of a link
        processedLine = processedLine.replace(/(?<!\]\()https?:\/\/[^\s<]+/g, (url) => {
          if (processedLine.includes(`](${url})`)) return url;
          return `<${url}>`;
        });
      }

      // Fix keyboard shortcuts: Detect common keys and wrap in backticks
      const keyboardKeys = ['Cmd', 'Ctrl', 'Alt', 'Shift', 'Enter', 'Tab', 'Esc', 'Delete', 'Backspace', 'Space'];
      for (const key of keyboardKeys) {
        const regex = new RegExp(`\\b${key}\\b(?![` + '`' + `\\]\\)])`, 'g');
        if (processedLine.match(regex) && !processedLine.includes('`' + key + '`')) {
          processedLine = processedLine.replace(regex, '`' + key + '`');
        }
      }

      // Fix common keyboard shortcuts: Cmd+K, Ctrl+C, Alt+Tab, etc.
      processedLine = processedLine.replace(/([Cc]md|[Cc]trl|[Aa]lt|[Ss]hift)\s*\+\s*([A-Za-z0-9])/g, '`$1` + `$2`');

      // Preserve nested blockquotes
      if (processedLine.match(/^>\s*>/)) {
        formatted.push(processedLine);
        continue;
      }

      // Check if already H1
      if (processedLine.match(/^#\s/)) {
        hasH1 = true;
        formatted.push(processedLine);
        if (!nextLineEmpty) {
          formatted.push('');
        }
        inList = false;
        continue;
      }

      // Preserve existing markdown (H2-H6, blockquotes) with smart spacing
      if (processedLine.match(/^#{2,6}\s/) || (processedLine.match(/^>\s/) && !processedLine.match(/^>\s*>/))) {
        // Add space before heading/blockquote if previous line wasn't blank
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '' && 
            !formatted[formatted.length - 1].match(/^#{1,6}\s/) && 
            !formatted[formatted.length - 1].match(/^>\s/)) {
          formatted.push('');
        }
        formatted.push(processedLine);
        if (!nextLineEmpty && !nextLine.match(/^#{2,6}\s/) && !nextLine.match(/^>\s/)) {
          formatted.push('');
        }
        inList = false;
        continue;
      }

      // Detect existing proper markdown lists
      if (processedLine.match(/^[-*+]\s+\S/) || processedLine.match(/^\d+\.\s+\S/)) {
        if (!inList && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push(processedLine);
        inList = true;
        // Add spacing after list ends
        if (!nextLine.match(/^[-*+]\s/) && !nextLine.match(/^\d+\.\s/) && nextLine && !nextLineEmpty) {
          formatted.push('');
          inList = false;
        }
        continue;
      }

      // Detect checkbox lists
      if (processedLine.match(/^[-*+]\s+\[(x|\s)\]\s+/i)) {
        if (!inList && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push(processedLine);
        inList = true;
        if (!nextLine.match(/^[-*+]\s+\[/)) {
          if (!nextLineEmpty) {
            formatted.push('');
          }
          inList = false;
        }
        continue;
      }

      // Auto-detect and normalize bullets: convert various bullet types to -
      const bulletMatch = processedLine.match(/^[-•*○◦▪▫]\s*(.+)/);
      if (bulletMatch) {
        if (!inList && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push(`- ${bulletMatch[1]}`);
        inList = true;
        // Check if next line continues the list
        if (!nextLine.match(/^[-•*○◦▪▫]\s/) && !nextLine.match(/^\d+[\.\)]/)) {
          if (!nextLineEmpty) {
            formatted.push('');
          }
          inList = false;
        }
        continue;
      }

      // Auto-detect numbered lists
      const numberedMatch = processedLine.match(/^\d+[\.\)]\s+(.+)/);
      if (numberedMatch) {
        if (!inList && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push(`1. ${numberedMatch[1]}`);
        inList = true;
        if (!nextLine.match(/^\d+[\.\)]/)) {
          if (!nextLineEmpty) {
            formatted.push('');
          }
          inList = false;
        }
        continue;
      }

      // Enhanced heading detection
      // NOTE: Heading pattern detection is DISABLED
      // The auto-formatter should NOT convert regular text into headings automatically

      // More sophisticated heading detection - DISABLED
      // The auto-formatter should NOT try to convert regular text into headings.
      // Only respect explicitly marked headings (that already start with #).
      // Trying to guess what should be a heading causes more harm than good.
      const isLikelyHeading = false; // DISABLED: aggressive auto-detection was harmful

      if (isLikelyHeading) {
        // This block will never execute now, kept for safety
        // but the logic is intentionally disabled
        continue;
      }
      // Detect and format callouts/important notes with better patterns
      else if (processedLine.match(/^(Important|Note|Warning|Tip|Remember|Pro Tip|Quick Tip|TL;DR|TLDR|Update|Breaking|Caution|Attention|Info|FYI|Bonus|Key Point|Essential|Error|Success|Fun Fact|Did You Know|Pro Tip|Gotcha|Watch Out|Key Takeaway):/i)) {
        const match = processedLine.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
            formatted.push('');
          }
          // Convert to emoji callout with better emoji selection
          const calloutType = match[1].toLowerCase();
          let emoji = 'ℹ️';
          
          if (calloutType.includes('warning') || calloutType.includes('watch') || calloutType.includes('caution')) emoji = '⚠️';
          else if (calloutType.includes('tip') || calloutType.includes('pro tip') || calloutType.includes('key takeaway')) emoji = '💡';
          else if (calloutType.includes('success') || calloutType.includes('done')) emoji = '✅';
          else if (calloutType.includes('important') || calloutType.includes('essential') || calloutType.includes('critical')) emoji = '🔥';
          else if (calloutType.includes('error') || calloutType.includes('gotcha')) emoji = '❌';
          else if (calloutType.includes('fun fact') || calloutType.includes('did you know')) emoji = '🎉';
          else if (calloutType.includes('remember')) emoji = '📝';
          else if (calloutType.includes('update') || calloutType.includes('breaking')) emoji = '📢';
          else if (calloutType.includes('bonus') || calloutType.includes('extra')) emoji = '🌟';

          formatted.push(`> ${emoji} **${match[1]}**\n> ${match[2]}`);
          if (!nextLineEmpty) {
            formatted.push('');
          }
        } else {
          formatted.push(processedLine);
        }
      }
      // Detect "Table of Contents" and format as heading if standalone
      else if (processedLine.match(/^Table of Contents$/i) && !processedLine.startsWith('#')) {
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push('## Table of Contents');
        if (!nextLineEmpty) {
          formatted.push('');
        }
      }
      // Detect horizontal rules
      else if (processedLine.match(/^(\*\*\*+|---+|___+)$/)) {
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push('---');
        if (!nextLineEmpty) {
          formatted.push('');
        }
      }
      // Detect progress/achievement lists and ensure proper checkbox formatting
      else if (processedLine.match(/^[-*]\s*\[(x|\s|✓|✗)\]/i)) {
        const checkbox = processedLine.match(/\[(x|✓)\]/i) ? '[x]' : '[ ]';
        const taskText = processedLine.replace(/^[-*]\s*\[.+?\]\s*/, '');
        if (!inList && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        formatted.push(`- ${checkbox} ${taskText}`);
        inList = true;
        if (!nextLine.match(/^[-*]\s*\[/)) {
          if (!nextLineEmpty) {
            formatted.push('');
          }
          inList = false;
        }
      }
      // Regular paragraph text
      else {
        // End previous list if this is a paragraph
        if (inList && prevLine && !prevLine.match(/^[-*+•○]\s/) && !prevLine.match(/^\d+[\.\)]/)) {
          inList = false;
          if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
            formatted.push('');
          }
        }

        formatted.push(processedLine);

        // Smart paragraph spacing
        const likelyNewParagraph = processedLine.length > 80 && nextLine && nextLine.length > 40;

        // Add spacing after paragraphs
        if (nextLineEmpty && !inList) {
          formatted.push('');
        } else if (likelyNewParagraph && !nextLine.startsWith('#') && !nextLine.startsWith('>') &&
                   !nextLine.match(/^[-*+•○]\s/) && !nextLine.match(/^\d+[\.\)]/)) {
          if (formatted[formatted.length - 1] !== '') {
            formatted.push('');
          }
        }
      }
    }

    // Add H1 from title at the very beginning if not present
    if (title && !hasH1) {
      formatted.unshift(`# ${title}`, '');
    }

    // Clean up formatting
    let result = formatted.join('\n').trim();

    // Remove excessive blank lines (more than 2)
    result = result.replace(/\n{3,}/g, '\n\n');

    // Ensure headings have space before and after
    result = result.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
    result = result.replace(/(#{1,6}\s+.+)\n([^#\n>])/g, '$1\n\n$2');

    // Fix spacing around blockquotes
    result = result.replace(/([^\n])\n(>\s)/g, '$1\n\n$2');
    result = result.replace(/(>\s.+)\n([^>\n])/g, '$1\n\n$2');

    // Fix spacing around horizontal rules
    result = result.replace(/([^\n])\n(---+|\*\*\*+|___+)\n/g, '$1\n\n$2\n\n');

    // Fix spacing around code blocks
    result = result.replace(/([^\n])\n```/g, '$1\n\n```');
    result = result.replace(/```\n([^`])/g, '```\n\n$1');

    // Fix spacing around lists
    result = result.replace(/([^\n])\n([-*+]\s|\d+\.\s)/g, '$1\n\n$2');
    result = result.replace(/(^[-*+]\s.+)(\n)([^-*+\d\n])/gm, '$1\n\n$3');

    // Fix spacing around tables
    result = result.replace(/([^\n])\n(\|)/g, '$1\n\n$2');
    result = result.replace(/(\|.+)\n([^|\n])/g, '$1\n\n$2');

    // Remove trailing spaces from lines
    result = result.split('\n').map(line => line.trimEnd()).join('\n');

    // Fix multiple spaces in text (but not in code)
    const lines_final = result.split('\n');
    result = lines_final.map(line => {
      if (line.trim().startsWith('```') || (line.includes('`') && !line.match(/^\d+\.\s/) && !line.match(/^[-*+]\s/))) return line;
      return line.replace(/\s{2,}/g, ' ');
    }).join('\n');

    // Ensure proper spacing after punctuation in sentences
    result = result.replace(/([.!?])([A-Z])/g, '$1 $2');

    // Ensure code blocks have spacing
    result = result.replace(/([^\n])\n(```)/g, '$1\n\n$2');
    result = result.replace(/(```)\n([^`\n])/g, '$1\n\n$2');

    // Final cleanup - remove trailing blank lines
    result = result.replace(/\n+$/, '\n');

    onFormat(result);
  };

  const insertHeading = (level: 1 | 2 | 3 | 4) => {
    const prefix = '#'.repeat(level);
    onInsert(`\n${prefix} Heading ${level}\n`);
  };

  const insertCodeBlock = () => {
    onInsert('\n```\n// Your code here\n```\n', { prefix: '\n```\n', suffix: '\n```\n' });
  };

  const insertInlineCode = () => {
    onInsert('`code`', { prefix: '`', suffix: '`' });
  };

  const insertBold = () => {
    onInsert('**bold text**', { prefix: '**', suffix: '**' });
  };

  const insertItalic = () => {
    onInsert('*italic text*', { prefix: '*', suffix: '*' });
  };

  const insertLink = () => {
    onInsert('[link text](https://example.com)');
  };

  const insertImage = () => {
    if (onInsertImage) {
      onInsertImage();
    } else {
      onInsert('![alt text](https://example.com/image.jpg)');
    }
  };

  const insertGif = () => {
    onInsert('![animated gif](https://example.com/animation.gif)');
  };

  const insertVideo = () => {
    onInsert('\n<video controls width="100%" class="rounded-lg my-4">\n  <source src="https://example.com/video.mp4" type="video/mp4" />\n  Your browser does not support the video tag.\n</video>\n');
  };

  const insertYouTube = () => {
    const embedCode = '\n<div class="video-wrapper my-6">\n  <iframe width="100%" height="400" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="rounded-lg"></iframe>\n</div>\n';
    onInsert(embedCode);
    toast.success('Replace VIDEO_ID with your YouTube video ID');
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      onInsert('\n1. First item\n2. Second item\n3. Third item\n');
    } else {
      onInsert('\n- First item\n- Second item\n- Third item\n');
    }
  };

  const insertTable = () => {
    onInsert('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
  };

  const insertBlockquote = () => {
    onInsert('\n> This is a blockquote\n> It can span multiple lines\n');
  };

  const insertDivider = () => {
    onInsert('\n---\n');
  };

  const insertChecklist = () => {
    onInsert('\n- [ ] Task 1\n- [ ] Task 2\n- [x] Completed task\n');
  };

  const insertCallout = (type: 'info' | 'warning' | 'success' | 'error') => {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };
    onInsert(`\n> ${emojis[type]} **${type.charAt(0).toUpperCase() + type.slice(1)}**\n> Your message here\n`);
  };

  const insertFootnote = () => {
    onInsert('This is a statement with a footnote.[^1]\n\n[^1]: This is the footnote text.');
  };

  const insertDefinitionList = () => {
    onInsert('\nTerm\n: Definition of the term\n\nAnother Term\n: Another definition\n');
  };

  const insertKeyboardKeys = () => {
    onInsert('Press `Cmd` + `K` to search');
  };

  const insertNestedBlockquote = () => {
    onInsert('\n> Main quote\n>\n> > Nested quote\n');
  };

  const insertTextAlignment = (alignment: 'center' | 'right' | 'justify') => {
    const templates = {
      center: '\n<div class="text-center">\n\n**Your centered content here**\n\n</div>\n',
      right: '\n<div class="text-right">\n\nYour right-aligned text here\n\n</div>\n',
      justify: '\n<div class="text-justify">\n\nYour justified paragraph here with multiple lines that will be evenly distributed across the width.\n\n</div>\n',
    };
    onInsert(templates[alignment]);
  };

  const insertCollapsible = () => {
    onInsert('\n<details>\n  <summary>Click to expand</summary>\n\n  Hidden content here. You can use **markdown** inside!\n</details>\n');
  };

  const insertTableOfContents = () => {
    onInsert('\n## Table of Contents\n- [Introduction](#introduction)\n- [Getting Started](#getting-started)\n- [Features](#features)\n- [Conclusion](#conclusion)\n');
  };

  const insertProgressTracker = () => {
    onInsert('\n### Progress\n- [x] Launch blog\n- [x] Write first post\n- [ ] Write 10 posts\n- [ ] Add newsletter\n- [ ] Reach 1000 readers\n');
  };

  const insertSnapshotTable = () => {
    onInsert('\n| Week | Focus | Result |\n|------|-------|--------|\n| 1    | Writing | 1 post |\n| 2    | Design | New theme |\n| 3    | Marketing | 100 views |\n');
  };

  const insertQuickLinks = (type: 'contact' | 'blog' | 'newsletter' | 'about' | 'full') => {
    const quickLinks = {
      contact: '\n---\n\n💬 **Thanks for reading!** [Contact me](/contact) if you have questions or feedback.\n',
      blog: '\n---\n\n📚 **Want more?** [Explore all posts](/blog) for more insights.\n',
      newsletter: '\n---\n\n📬 **Stay updated!** [Subscribe to the newsletter](/newsletter) for the latest articles.\n',
      about: '\n---\n\n👋 **Learn more** [About me](/about) and what I do.\n',
      full: '\n---\n\n### Thanks for Reading!\n\n- 💬 [Contact me](/contact) for questions or feedback\n- 📚 [Explore more posts](/blog) for additional insights\n- 📬 [Subscribe to the newsletter](/newsletter) to stay updated\n-  [Learn more about me](/about)\n',
    };
    onInsert(quickLinks[type]);
  };

  const generateBacklinks = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/blog/your-post';
    const postTitle = title || 'this post';

    const backlinksMarkdown = `
---

### Related & Backlinks

**Internal Links:**
- [Home](/) - Return to homepage
- [All Blog Posts](/blog) - Browse all articles
- [Categories](/categories) - Explore by topic
- [Tags](/tags) - Find related content
- [Search](/search) - Find specific topics

**Share this post:**
- Link to this page: \`${currentUrl}\`
- Reference in your content: \`[${postTitle}](${currentUrl})\`

**Quick References:**
\`\`\`markdown
<!-- Copy & paste these into your content -->

As mentioned in [${postTitle}](${currentUrl})...

For more details, see [${postTitle}](${currentUrl}).

Related: [${postTitle}](${currentUrl})
\`\`\`

---
`;
    onInsert(backlinksMarkdown);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 p-2"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          {onFormat && (
            <button
              type="button"
              onClick={autoFormat}
              className="px-2 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1 group relative"
              title={getButtonTooltip('auto-format')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              <span className="text-xs font-medium">Auto-Format</span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-950 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                {getButtonTooltip('auto-format')}
              </div>
            </button>
          )}
          <button
            type="button"
            onClick={insertBold}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title={getButtonTooltip('bold')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertItalic}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title={getButtonTooltip('italic')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertInlineCode}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title={getButtonTooltip('inline-code')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onInsert('==highlighted text==', { prefix: '==', suffix: '==' })}
            className="p-1.5 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-yellow-600 dark:text-yellow-400"
            title="Highlight text"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.75 8L14 4.25l-10 10V17h2.75l10-10zM20 9.25L17.75 7 15 9.75 17.25 12 20 9.25zM2 20h20v2H2v-2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onInsert('<u>underlined text</u>', { prefix: '<u>', suffix: '</u>' })}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Underline text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 20h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onInsert('||spoiler text||', { prefix: '||', suffix: '||' })}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Spoiler/Hidden text (click to reveal)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => insertHeading(1)}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertHeading(2)}
            className="px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => insertList(false)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Unordered list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertList(true)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Ordered list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertChecklist}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Checklist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertGif}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert GIF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertVideo}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert video"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertYouTube}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert YouTube/Embed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </button>
        </div>

        {/* Code */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Code block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* Special Blocks */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertBlockquote}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Blockquote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertDivider}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Horizontal divider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onInsert('Text with footnote[^1]\\n\\n[^1]: Footnote content here')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert footnote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
        </div>

        {/* Callouts */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Callouts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                type="button"
                onClick={() => insertCallout('info')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>ℹ️</span> Info
              </button>
              <button
                type="button"
                onClick={() => insertCallout('warning')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>⚠️</span> Warning
              </button>
              <button
                type="button"
                onClick={() => insertCallout('success')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>✅</span> Success
              </button>
              <button
                type="button"
                onClick={() => insertCallout('error')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>❌</span> Error
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Advanced Markdown"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[160px]">
              <button
                type="button"
                onClick={insertFootnote}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📌</span> Footnote
              </button>
              <button
                type="button"
                onClick={insertDefinitionList}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📖</span> Definition List
              </button>
              <button
                type="button"
                onClick={insertKeyboardKeys}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>⌨️</span> Keyboard Keys
              </button>
              <button
                type="button"
                onClick={insertNestedBlockquote}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>💬</span> Nested Quote
              </button>
              <button
                type="button"
                onClick={insertCollapsible}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📂</span> Collapsible
              </button>
              <button
                type="button"
                onClick={insertTableOfContents}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📋</span> Table of Contents
              </button>
              <button
                type="button"
                onClick={insertProgressTracker}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📊</span> Progress Tracker
              </button>
              <button
                type="button"
                onClick={insertSnapshotTable}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📸</span> Snapshot Table
              </button>
            </div>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Text Alignment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[140px]">
              <button
                type="button"
                onClick={() => insertTextAlignment('center')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M9 18h6" />
                </svg>
                Center
              </button>
              <button
                type="button"
                onClick={() => insertTextAlignment('right')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M12 18h4" />
                </svg>
                Right
              </button>
              <button
                type="button"
                onClick={() => insertTextAlignment('justify')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Justify
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links & Backlinks */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Quick Links"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[180px]">
              <button
                type="button"
                onClick={() => insertQuickLinks('full')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>🔗</span> Full Quick Links
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                type="button"
                onClick={() => insertQuickLinks('contact')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>💬</span> Contact Link
              </button>
              <button
                type="button"
                onClick={() => insertQuickLinks('blog')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📚</span> Blog Link
              </button>
              <button
                type="button"
                onClick={() => insertQuickLinks('newsletter')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📬</span> Newsletter Link
              </button>
              <button
                type="button"
                onClick={() => insertQuickLinks('about')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>👋</span> About Link
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={generateBacklinks}
            className="px-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
            title="Generate Backlinks"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs font-medium">Backlinks</span>
          </button>
        </div>

        {/* Gallery Quick Insert */}
        {galleryImages && galleryImages.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-gray-300 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Gallery:</span>
            <div className="flex gap-1 flex-wrap">
              {galleryImages.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onInsert(`![](${img.url})`)}
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-700 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  title={`Insert ${img.url}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {galleryImages.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                  +{galleryImages.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

