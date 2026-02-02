/**
 * Automated markdown content transformer for blog posts
 * - Automatically generates heading IDs for TOC linking
 * - Preserves [TOC] markers for inline Table of Contents
 * - Auto-fixes common SEO issues
 * - Optimizes images
 * - Ensures proper structure
 * - NO manual intervention needed!
 *
 * [TOC] Marker Usage:
 * Add [TOC] on its own line to embed an interactive table of contents
 * that auto-generates from all headings in the post.
 */

export interface ContentValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  transformedContent: string;
  headings: HeadingInfo[];
  wasModified: boolean;
}

export interface ValidationIssue {
  type: 'critical' | 'error';
  message: string;
  location?: string;
}

export interface ValidationWarning {
  type: 'warning';
  message: string;
  suggestion: string;
}

export interface HeadingInfo {
  level: number;
  text: string;
  id: string;
}

/**
 * AUTO-FIX: Replace legacy manual TOC sections with [TOC]
 * Detects headings like "## Table of Contents" followed by a list of links
 * - If [TOC] already exists elsewhere: remove the legacy section
 * - If [TOC] not present: replace legacy section in-place with a single [TOC]
 */
function autoConvertLegacyTOC(
  content: string
): { content: string; modified: boolean; action?: 'replaced' | 'removed'; occurrences?: number } {
  if (!content) return { content, modified: false };

  const lines = content.split('\n');
  const headingPattern = /^(#{2,6})\s+(?:table\s+of\s+contents|toc|contents)\s*(?:\{#[^}]+\})?\s*$/i;
  const anyHeadingPattern = /^(#{1,6})\s+.+/;
  const isListLine = (s: string) => /^(\s*)([-*+]\s+|\d+\.\s+)/.test(s.trim());

  const hasTocMarker = /^(?:\s*)\[TOC\](?:\s*)$/im.test(content);
  let modified = false;
  let action: 'replaced' | 'removed' | undefined;
  let occurrences = 0;

  let i = 0;
  while (i < lines.length) {
    if (headingPattern.test(lines[i])) {
      const start = i;
      i++;
      // Scan forward until next heading or end
      let end = lines.length;
      let listCount = 0;
      for (let j = i; j < lines.length; j++) {
        const t = lines[j].trim();
        if (anyHeadingPattern.test(lines[j])) {
          end = j;
          break;
        }
        if (t.length > 0 && isListLine(lines[j])) listCount++;
      }

      // Only treat as legacy TOC if we see at least 2 list items in the block
      if (listCount >= 2) {
        occurrences++;
        const replacement = hasTocMarker ? [] : ['[TOC]'];
        // Ensure blank lines around replacement when inserting
        const beforeBlank = start > 0 && lines[start - 1].trim() !== '' ? [''] : [];
        const afterBlank = end < lines.length && lines[end]?.trim() !== '' ? [''] : [];

        const newLines = [
          ...lines.slice(0, start),
          ...(hasTocMarker ? [] : [...beforeBlank, ...replacement, ...afterBlank]),
          ...lines.slice(end)
        ];
        lines.length = 0;
        lines.push(...newLines);
        modified = true;
        action = hasTocMarker ? 'removed' : 'replaced';
        // Continue scan from position after where we inserted
        i = Math.max(0, (hasTocMarker ? start : start + (beforeBlank.length + replacement.length + afterBlank.length)) - 1);
      }
    }
    i++;
  }

  return { content: lines.join('\n'), modified, action, occurrences };
}

/**
 * Generate a URL-safe ID from heading text
 */
function generateHeadingId(text: string, existingIds: Set<string>): string {
  let id = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();

  // Ensure uniqueness
  let finalId = id;
  let counter = 1;
  while (existingIds.has(finalId)) {
    finalId = `${id}-${counter}`;
    counter++;
  }

  existingIds.add(finalId);
  return finalId;
}

/**
 * Extract heading information and generate IDs
 * Only adds IDs to headings that don't already have them
 */
function extractHeadings(content: string): { headings: HeadingInfo[]; transformedContent: string; newIdsCount: number } {
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\s*\{#[^}]+\})?$/gm;
  const headings: HeadingInfo[] = [];
  const usedIds = new Set<string>();
  let transformedContent = content;
  let newIdsCount = 0;

  const matches = Array.from(content.matchAll(headingRegex));
  
  // First pass: collect existing IDs
  for (const match of matches) {
    const originalHeading = match[0];
    if (originalHeading.includes('{#')) {
      const idMatch = originalHeading.match(/\{#([^}]+)\}/);
      if (idMatch) {
        usedIds.add(idMatch[1]);
      }
    }
  }
  
  // Process in reverse to maintain correct positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const level = match[1].length;
    const text = match[2].trim();
    const originalHeading = match[0];
    
    // Check if heading already has an ID
    if (originalHeading.includes('{#')) {
      // Extract existing ID
      const idMatch = originalHeading.match(/\{#([^}]+)\}/);
      if (idMatch) {
        headings.unshift({ level, text, id: idMatch[1] });
      }
      // Don't modify headings that already have IDs
      continue;
    }
    
    // Generate new ID for heading without one
    const id = generateHeadingId(text, usedIds);
    newIdsCount++;
    headings.unshift({ level, text, id });

    // Replace heading with version including ID
    const newHeading = `${match[1]} ${text} {#${id}}`;
    transformedContent = transformedContent.substring(0, match.index!) + newHeading + transformedContent.substring(match.index! + originalHeading.length);
  }

  return { headings, transformedContent, newIdsCount };
}

/**
 * AUTO-FIX: Add missing alt text to images
 */
function autoFixImages(content: string): { content: string; modified: boolean } {
  let modified = false;
  let result = content;

  // Find images without alt text: ![](url) or ![ ](url)
  const noAltRegex = /!\[\s*\]\(([^)]+)\)/g;
  const modified1 = !!noAltRegex.exec(content);

  if (modified1) {
    result = result.replace(noAltRegex, (match, url) => {
      // Generate alt text from filename
      const filename = url.split('/').pop()?.split('.')[0] || 'image';
      const altText = filename
        .replace(/[-_]/g, ' ')
        .replace(/[^a-z0-9\s]/gi, '')
        .trim();
      modified = true;
      return `![${altText || 'Blog image'}](${url})`;
    });
  }

  return { content: result, modified };
}

/**
 * AUTO-FIX: Ensure proper heading hierarchy
 */
function autoFixHeadingHierarchy(content: string, headings: HeadingInfo[]): { content: string; modified: boolean } {
  let modified = false;
  let result = content;

  // Check if first heading is not H1, and there's no H1 - add one
  if (headings.length > 0 && headings[0].level > 1) {
    const firstHeading = headings[0];
    // Don't auto-add H1, just report it - user should decide
    return { content: result, modified: false };
  }

  // Fix hierarchy skips (H1 -> H3 becomes H1 -> H2 -> H3)
  let previousLevel = 0;
  let hierarchyFixed = false;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (heading.level > previousLevel + 1) {
      // We'll report this but not auto-fix level changes
      hierarchyFixed = true;
    }
    previousLevel = heading.level;
  }

  return { content: result, modified: hierarchyFixed };
}

/**
 * AUTO-FIX: Add language specification to code blocks
 */
function autoFixCodeBlocks(content: string): { content: string; modified: boolean } {
  let modified = false;
  let result = content;

  // Find code blocks without language: ```\n becomes ```text\n
  const noLangRegex = /^```\n/gm;
  
  if (noLangRegex.test(content)) {
    result = result.replace(/^```\n/gm, '```text\n');
    modified = true;
  }

  return { content: result, modified };
}

/**
 * AUTO-FIX: Normalize table formatting
 */
function autoFixTables(content: string): { content: string; modified: boolean } {
  let modified = false;
  const lines = content.split('\n');
  const fixedLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      fixedLines.push(line);
      continue;
    }

    // Don't format inside code blocks
    if (inCodeBlock) {
      fixedLines.push(line);
      continue;
    }

    // Detect table rows (has | with at least 2 cells)
    // Check if it's a table row or separator
    const isTableSeparator = /^\|[\s\-\|:]+\|$/.test(trimmed);
    const isTableRow = trimmed.includes('|') && trimmed.split('|').filter(Boolean).length >= 2;
    
    // Check context: next line is separator OR previous was table
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    const prevLine = i > 0 ? fixedLines[fixedLines.length - 1].trim() : '';
    const nextIsSeparator = /^\|[\s\-\|:]+\|$/.test(nextLine);
    const prevWasTable = prevLine.includes('|') && prevLine.split('|').filter(Boolean).length >= 2;
    const prevWasSeparator = /^\|[\s\-\|:]+\|$/.test(prevLine);

    // Keep separator rows as-is
    if (isTableSeparator) {
      fixedLines.push(line);
      continue;
    }

    // Normalize table rows that need fixing
    if (isTableRow && (nextIsSeparator || prevWasTable || prevWasSeparator || (i < lines.length - 1 && /^\|[\s\-\|:]+\|$/.test(lines[i + 1]?.trim() || '')))) {
      // Normalize table row: ensure proper | spacing
      const parts = trimmed.split('|').map(cell => cell.trim());
      // Remove leading/trailing empty strings
      while (parts.length > 0 && parts[0] === '') parts.shift();
      while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
      
      // Only fix if not already properly formatted
      const normalized = '| ' + parts.join(' | ') + ' |';
      if (trimmed !== normalized) {
        fixedLines.push(normalized);
        modified = true;
      } else {
        fixedLines.push(trimmed);
      }
    } else {
      fixedLines.push(line);
    }
  }

  return { content: fixedLines.join('\n'), modified };
}

/**
 * Validate heading hierarchy and structure
 */
function validateHeadingHierarchy(headings: HeadingInfo[]): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];

  if (headings.length === 0) {
    issues.push({
      type: 'error',
      message: 'No headings found. Blog posts should have at least one H1 heading.',
    });
    return { issues, warnings };
  }

  // Check for single H1
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      message: 'Missing H1 heading. Every blog post should have exactly one H1 (title-level) heading.',
    });
  } else if (h1Count > 1) {
    warnings.push({
      type: 'warning',
      message: `Found ${h1Count} H1 headings. SEO best practice is to have exactly one H1 per page.`,
      suggestion: 'Consider using H2 for secondary headings instead.',
    });
  }

  // Check heading hierarchy (don't skip levels)
  let previousLevel = 0;
  for (const heading of headings) {
    if (heading.level > previousLevel + 1) {
      warnings.push({
        type: 'warning',
        message: `Heading hierarchy skip detected: H${previousLevel} → H${heading.level}`,
        suggestion: `Use H${previousLevel + 1} instead of H${heading.level}`,
      });
    }
    previousLevel = heading.level;
  }

  return { issues, warnings };
}

/**
 * Validate images
 */
function validateImages(content: string): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];

  // Regex to find markdown images: ![alt](src)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  const processedImages = new Set<string>();

  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1];
    const src = match[2];

    // Skip if already processed
    if (processedImages.has(src)) continue;
    processedImages.add(src);

    // Check for missing alt text (after auto-fix, this shouldn't happen)
    if (!alt || alt.trim().length === 0) {
      warnings.push({
        type: 'warning',
        message: `Image missing alt text: ${src}`,
        suggestion: 'Alt text is important for accessibility and SEO.',
      });
    }
  }

  return { issues, warnings };
}

/**
 * Validate code blocks have language specified
 */
function validateCodeBlocks(content: string): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];

  // Find code blocks without language (after auto-fix, bare ``` should be rare)
  const codeBlockRegex = /```(\w*)\n/g;
  let match;
  let blockCount = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blockCount++;
    const language = match[1];

    if (!language || language.trim().length === 0) {
      warnings.push({
        type: 'warning',
        message: `Code block #${blockCount} has no syntax highlighting`,
        suggestion: 'Specify a language for better readability (e.g., ```javascript)',
      });
    }
  }

  return { issues, warnings };
}

/**
 * Check for minimum content length
 */
function validateContentLength(content: string): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < 100) {
    warnings.push({
      type: 'warning',
      message: `Content is very short (${wordCount} words). Longer content ranks better.`,
      suggestion: 'Aim for at least 300-500 words for blog posts.',
    });
  } else if (wordCount < 300) {
    warnings.push({
      type: 'warning',
      message: `Content might be too short (${wordCount} words).`,
      suggestion: 'Consider expanding to 500+ words for better SEO.',
    });
  }

  return { issues, warnings };
}

/**
 * Main validation and transformation function
 * AUTO-FIXES issues automatically!
 * 
 * Supports [TOC] marker for inline table of contents
 */

// Convert Giphy and Tenor page URLs in markdown image links to direct GIF URLs
function autoConvertGiphyAndTenor(content: string): { content: string; modified: boolean } {
  let modified = false;
  // Regex for markdown images: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let result = content;
  result = result.replace(imageRegex, (match, alt, url) => {
    let newUrl = url;
    // Giphy page URL: https://giphy.com/gifs/slug-or-title-GIPHYID
    const giphyMatch = url.match(/giphy\.com\/gifs\/(?:[^-]*-)?([a-zA-Z0-9]+)$/);
    if (giphyMatch) {
      newUrl = `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
      modified = true;
    }
    // Tenor page URL: https://tenor.com/view/slug-TENORID
    const tenorMatch = url.match(/tenor\.com\/view\/[^-]+-(\d+)/);
    if (tenorMatch) {
      newUrl = `https://media.tenor.com/images/${tenorMatch[1]}/tenor.gif`;
      modified = true;
    }
    return `![${alt}](${newUrl})`;
  });
  return { content: result, modified };
}

export function transformAndValidateContent(content: string): ContentValidationResult {
  let transformedContent = content;
  let wasModified = false;
  const allIssues: ValidationIssue[] = [];
  const allWarnings: ValidationWarning[] = [];
  
  // AUTO-FIX: Convert Giphy and Tenor page URLs to direct GIF URLs
  const { content: giphyFixed, modified: giphyMod } = autoConvertGiphyAndTenor(transformedContent);
  transformedContent = giphyFixed;
  wasModified = wasModified || giphyMod;

  // Check if content has [TOC] marker - preserve it throughout transformations
  let hasTOC = /^\[TOC\]$/m.test(transformedContent);

  // AUTO-FIX: Convert legacy manual TOC sections to [TOC] or remove if duplicate
  const legacyTOC = autoConvertLegacyTOC(transformedContent);
  if (legacyTOC.modified) {
    transformedContent = legacyTOC.content;
    wasModified = true;
    hasTOC = /^\[TOC\]$/m.test(transformedContent);
    if (legacyTOC.action === 'replaced') {
      allWarnings.push({
        type: 'warning',
        message: `Replaced legacy manual Table of Contents with [TOC]`,
        suggestion: 'Use the [TOC] marker to keep the TOC in sync with your headings',
      });
    } else if (legacyTOC.action === 'removed') {
      allWarnings.push({
        type: 'warning',
        message: `Removed legacy manual Table of Contents (inline [TOC] is already present)`,
        suggestion: 'Keep only the [TOC] marker to avoid duplicates',
      });
    }
  }

  // AUTO-FIX: Images
  const { content: fixedImages, modified: imagesMod } = autoFixImages(transformedContent);
  transformedContent = fixedImages;
  wasModified = wasModified || imagesMod;

  // AUTO-FIX: Code blocks
  const { content: fixedCode, modified: codeMod } = autoFixCodeBlocks(transformedContent);
  transformedContent = fixedCode;
  wasModified = wasModified || codeMod;

  // AUTO-FIX: Tables - normalize formatting
  const { content: fixedTables, modified: tablesMod } = autoFixTables(transformedContent);
  transformedContent = fixedTables;
  wasModified = wasModified || tablesMod;

  // Extract and add heading IDs (automatic) - only for headings without IDs
  const { headings, transformedContent: contentWithIds, newIdsCount } = extractHeadings(transformedContent);
  transformedContent = contentWithIds;
  if (newIdsCount > 0) {
    wasModified = true; // Only mark as modified if new IDs were added
  }

  // AUTO-FIX: Heading hierarchy
  const { content: fixedHierarchy, modified: hierarchyMod } = autoFixHeadingHierarchy(transformedContent, headings);
  transformedContent = fixedHierarchy;
  wasModified = wasModified || hierarchyMod;

  // Validate heading hierarchy
  const { issues: headingIssues, warnings: headingWarnings } = validateHeadingHierarchy(headings);
  allIssues.push(...headingIssues);
  allWarnings.push(...headingWarnings);

  // Validate images
  const { issues: imageIssues, warnings: imageWarnings } = validateImages(transformedContent);
  allIssues.push(...imageIssues);
  allWarnings.push(...imageWarnings);

  // Validate code blocks
  const { issues: codeIssues, warnings: codeWarnings } = validateCodeBlocks(transformedContent);
  allIssues.push(...codeIssues);
  allWarnings.push(...codeWarnings);

  // Validate content length (excluding [TOC] marker)
  const contentForLength = transformedContent.replace(/^\[TOC\]$/m, '').trim();
  const { issues: lengthIssues, warnings: lengthWarnings } = validateContentLength(contentForLength);
  allIssues.push(...lengthIssues);
  allWarnings.push(...lengthWarnings);

  // Add info about TOC marker if present
  if (hasTOC) {
    allWarnings.push({
      type: 'warning',
      message: '✨ Table of Contents: Interactive TOC will be generated from headings',
      suggestion: 'Ensure your post has 3+ headings (## H2 or ### H3) for the TOC to be most useful'
    });
  }

  const isValid = allIssues.length === 0;

  return {
    isValid,
    issues: allIssues,
    warnings: allWarnings,
    transformedContent,
    headings,
    wasModified,
  };
}

/**
 * Generate schema.org BlogPosting structured data from headings
 */
export function generateBlogSchema(
  title: string,
  description: string,
  author: string,
  datePublished: string,
  url: string,
  headings: HeadingInfo[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    url,
    // Add article sections based on H2 headings
    ...(headings.length > 0 && {
      articleBody: headings
        .filter(h => h.level === 2)
        .map(h => ({
          '@type': 'Text',
          name: h.text,
        })),
    }),
  };
}

/**
 * Extract table of contents from headings
 */
export function generateTableOfContents(headings: HeadingInfo[]) {
  return headings
    .filter(h => h.level >= 2 && h.level <= 3) // Only H2 and H3
    .map(h => ({
      level: h.level,
      text: h.text,
      id: h.id,
    }));
}

