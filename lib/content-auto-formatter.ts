/**
 * Enhanced Content Auto-Formatter
 * Intelligently fixes and normalizes blog post content
 * Combines semantic fixes (heading IDs, alt text) with formatting (spacing, lists)
 * Works seamlessly with LiveMarkdownEditor
 */

import { transformAndValidateContent } from './markdown-transformer';

export interface AutoFormattingResult {
  originalContent: string;
  formattedContent: string;
  wasModified: boolean;
  changesSummary: {
    headingIDsGenerated: number;
    imagesMissingAltFixed: number;
    codeBlocksFormatted: number;
    spacingNormalized: number;
    listsFormatted: number;
    tablesNormalized: number;
    otherIssuesFound: number;
  };
  issues: any[];
  warnings: any[];
}

/**
 * Smart formatting: Normalize spacing, lists, and structure
 * This complements the semantic fixes from markdown-transformer
 */
function smartFormatContent(content: string): { content: string; changes: number } {
  if (!content || content.trim().length === 0) {
    return { content, changes: 0 };
  }

  let formatted = content;
  let changes = 0;
  const lines = formatted.split('\n');
  const formattedLines: string[] = [];
  let inCodeBlock = false;
  let consecutiveBlankLines = 0;
  let inList = false;
  let listIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

    // Preserve [TOC] markers - these are special placeholders for Table of Contents
    if (trimmed === '[TOC]') {
      // Ensure proper spacing around TOC marker
      const lastLine = formattedLines[formattedLines.length - 1];
      if (lastLine !== '') {
        formattedLines.push('');
      }
      formattedLines.push('[TOC]');
      formattedLines.push('');
      consecutiveBlankLines = 0;
      continue;
    }

    // Track code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      formattedLines.push(line);
      consecutiveBlankLines = 0;
      continue;
    }

    // Don't format inside code blocks
    if (inCodeBlock) {
      formattedLines.push(line);
      continue;
    }

    // Handle empty lines - normalize to max 2 consecutive
    if (!trimmed) {
      consecutiveBlankLines++;
      if (consecutiveBlankLines <= 2 && formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
        if (consecutiveBlankLines === 1) changes++;
      }
      continue;
    }
    consecutiveBlankLines = 0;

    // Normalize list formatting
    const listMatch = trimmed.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const [, indent, marker, content] = listMatch;
      const normalizedIndent = indent.replace(/\t/g, '  '); // Convert tabs to spaces
      const normalizedLine = normalizedIndent + marker + ' ' + content.trim();
      
      if (line !== normalizedLine) {
        changes++;
      }
      formattedLines.push(normalizedLine);
      inList = true;
      continue;
    }

    // Normalize table formatting - detect tables with better pattern matching
    // Tables have | characters with at least 2 cells, and are followed by separator row
    const isTableRow = trimmed.includes('|') && trimmed.split('|').filter(Boolean).length >= 2;
    const isTableSeparator = /^\|[\s\-\|:]+\|$/.test(trimmed);
    const nextIsTableSeparator = i < lines.length - 1 && /^\|[\s\-\|:]+\|$/.test(lines[i + 1].trim());
    const prevWasTable = formattedLines.length > 0 && formattedLines[formattedLines.length - 1].includes('|');
    
    if (isTableRow && (isTableSeparator || nextIsTableSeparator || prevWasTable)) {
      // Split by |, trim each cell, filter empty strings at start/end
      const parts = trimmed.split('|').map(cell => cell.trim());
      // Remove leading/trailing empty strings (from leading/trailing |)
      while (parts.length > 0 && parts[0] === '') parts.shift();
      while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
      
      // Normalize to proper markdown table format: | cell | cell |
      const normalizedTable = '| ' + parts.join(' | ') + ' |';
      if (trimmed !== normalizedTable && !isTableSeparator) {
        changes++;
        formattedLines.push(normalizedTable);
      } else {
        formattedLines.push(trimmed); // Keep separator rows as-is
      }
      continue;
    }

    // Normalize heading spacing (ensure space after #)
    const headingMatch = trimmed.match(/^(#{1,6})([^\s#])/);
    if (headingMatch) {
      const normalized = trimmed.replace(/^(#{1,6})([^\s#])/, '$1 $2');
      formattedLines.push(normalized);
      if (line !== normalized) changes++;
      continue;
    }

    // Preserve other lines
    formattedLines.push(line);
  }

  return {
    content: formattedLines.join('\n'),
    changes,
  };
}

/**
 * Enhanced auto-formatting that combines semantic fixes + smart formatting
 * This is what gets called when saving a post or when user clicks format
 */
export function autoFormatContent(content: string, options?: { 
  preserveCursor?: boolean;
  formatSpacing?: boolean;
}): AutoFormattingResult {
  if (!content || content.trim().length === 0) {
    return {
      originalContent: content,
      formattedContent: content,
      wasModified: false,
      changesSummary: {
        headingIDsGenerated: 0,
        imagesMissingAltFixed: 0,
        codeBlocksFormatted: 0,
        spacingNormalized: 0,
        listsFormatted: 0,
        tablesNormalized: 0,
        otherIssuesFound: 0,
      },
      issues: [],
      warnings: [],
    };
  }

  // Step 1: Apply semantic fixes (heading IDs, alt text, code blocks)
  const semanticResult = transformAndValidateContent(content);

  // Step 2: Apply smart formatting (spacing, lists, tables) if enabled
  let finalContent = semanticResult.transformedContent;
  let spacingChanges = 0;
  let listChanges = 0;
  let tableChanges = 0;

  if (options?.formatSpacing !== false) {
    const formatResult = smartFormatContent(finalContent);
    finalContent = formatResult.content;
    spacingChanges = formatResult.changes;
    
    // Count specific formatting changes
    const originalLines = semanticResult.transformedContent.split('\n');
    const formattedLines = finalContent.split('\n');
    
    for (let i = 0; i < Math.min(originalLines.length, formattedLines.length); i++) {
      const orig = originalLines[i];
      const fmt = formattedLines[i];
      
      if (orig !== fmt) {
        if (orig.match(/^(\s*)([-*+]|\d+\.)/) || fmt.match(/^(\s*)([-*+]|\d+\.)/)) {
          listChanges++;
        } else if (orig.includes('|') && fmt.includes('|')) {
          tableChanges++;
        }
      }
    }
  }

  const wasModified = semanticResult.wasModified || spacingChanges > 0;

  // Count what was fixed - only count NEW changes
  const originalImagesWithoutAlt = (content.match(/!\[\s*\]\(/g) || []).length;
  const finalImagesWithoutAlt = (finalContent.match(/!\[\s*\]\(/g) || []).length;
  const imagesFixed = originalImagesWithoutAlt - finalImagesWithoutAlt;
  
  const originalCodeBlocks = (content.match(/```\s*\n/g) || []).length;
  const finalCodeBlocks = (finalContent.match(/```\w+\n/g) || []).length;
  const codeBlocksFixed = Math.max(0, finalCodeBlocks - originalCodeBlocks);
  
  // Count headings that got NEW IDs (not ones that already had them)
  const originalHeadingsWithIds = (content.match(/#+\s+.+?\s*\{#[^}]+\}/g) || []).length;
  const finalHeadingsWithIds = (finalContent.match(/#+\s+.+?\s*\{#[^}]+\}/g) || []).length;
  const newHeadingIds = Math.max(0, finalHeadingsWithIds - originalHeadingsWithIds);
  
  const changesSummary = {
    headingIDsGenerated: newHeadingIds,
    imagesMissingAltFixed: imagesFixed,
    codeBlocksFormatted: codeBlocksFixed,
    spacingNormalized: spacingChanges,
    listsFormatted: listChanges,
    tablesNormalized: tableChanges,
    otherIssuesFound: semanticResult.issues.length,
  };

  return {
    originalContent: content,
    formattedContent: finalContent,
    wasModified,
    changesSummary,
    issues: semanticResult.issues,
    warnings: semanticResult.warnings,
  };
}

/**
 * Format content for display (e.g., in preview)
 */
export function getFormattedContentForDisplay(content: string): string {
  const result = transformAndValidateContent(content);
  return result.transformedContent;
}

/**
 * Get formatting summary for notification/logging
 */
export function getFormattingSummary(result: AutoFormattingResult): string {
  if (!result.wasModified) {
    return '✅ Content is already well-formatted';
  }

  const parts = [];
  
  if (result.changesSummary.headingIDsGenerated > 0) {
    parts.push(`${result.changesSummary.headingIDsGenerated} heading${result.changesSummary.headingIDsGenerated > 1 ? 's' : ''} with IDs`);
  }
  if (result.changesSummary.imagesMissingAltFixed > 0) {
    parts.push(`Fixed ${result.changesSummary.imagesMissingAltFixed} image${result.changesSummary.imagesMissingAltFixed > 1 ? 's' : ''} alt text`);
  }
  if (result.changesSummary.codeBlocksFormatted > 0) {
    parts.push(`Formatted ${result.changesSummary.codeBlocksFormatted} code block${result.changesSummary.codeBlocksFormatted > 1 ? 's' : ''}`);
  }
  if (result.changesSummary.spacingNormalized > 0) {
    parts.push(`Normalized spacing`);
  }
  if (result.changesSummary.listsFormatted > 0) {
    parts.push(`Formatted ${result.changesSummary.listsFormatted} list${result.changesSummary.listsFormatted > 1 ? 's' : ''}`);
  }
  if (result.changesSummary.tablesNormalized > 0) {
    parts.push(`Normalized ${result.changesSummary.tablesNormalized} table${result.changesSummary.tablesNormalized > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return '✨ Content formatted';
  }

  return `✨ Auto-formatted: ${parts.join(', ')}`;
}

/**
 * Quick format for LiveMarkdownEditor - lighter formatting for real-time use
 * Only applies essential fixes without heavy restructuring
 */
export function quickFormatContent(content: string): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  // Only apply semantic fixes (heading IDs, alt text) - skip spacing normalization
  const result = transformAndValidateContent(content);
  return result.transformedContent;
}

/**
 * Full format for save/submit - applies all formatting
 */
export function fullFormatContent(content: string): AutoFormattingResult {
  return autoFormatContent(content, { formatSpacing: true });
}
