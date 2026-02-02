/**
 * Integration hooks for markdown validation in admin dashboard
 * Provides real-time validation feedback as users write
 */

import React, { useState, useCallback, useEffect } from 'react';
import { transformAndValidateContent, generateTableOfContents } from '@/lib/markdown-transformer';

export interface ContentValidationState {
  issues: any[];
  warnings: any[];
  headings: any[];
  tableOfContents: any[];
  isValid: boolean;
}

/**
 * Hook for real-time markdown validation
 * Validates content as user types
 */
export function useContentValidation(content: string) {
  const [validationState, setValidationState] = useState<ContentValidationState>({
    issues: [],
    warnings: [],
    headings: [],
    tableOfContents: [],
    isValid: true,
  });

  // Validate content with debouncing
  const validateContent = useCallback(() => {
    if (!content || content.trim().length === 0) {
      setValidationState({
        issues: [],
        warnings: [],
        headings: [],
        tableOfContents: [],
        isValid: true,
      });
      return;
    }

    const result = transformAndValidateContent(content);
    const toc = generateTableOfContents(result.headings);

    setValidationState({
      issues: result.issues,
      warnings: result.warnings,
      headings: result.headings,
      tableOfContents: toc,
      isValid: result.isValid,
    });
  }, [content]);

  // Validate when content changes
  useEffect(() => {
    const timer = setTimeout(validateContent, 500); // Debounce 500ms
    return () => clearTimeout(timer);
  }, [content, validateContent]);

  return validationState;
}

/**
 * Generate SEO metadata suggestions from content
 */
export function generateSEOSuggestions(content: string, title: string) {
  const result = transformAndValidateContent(content);

  const suggestions = [];

  // Title suggestion
  if (title.length < 30) {
    suggestions.push({
      field: 'title',
      message: 'Title might be too short for SEO',
      suggestion: 'Aim for 30-60 characters',
      current: title,
    });
  } else if (title.length > 60) {
    suggestions.push({
      field: 'title',
      message: 'Title might be truncated in search results',
      suggestion: 'Keep under 60 characters',
      current: title,
    });
  }

  // Heading suggestions
  const h1Count = result.headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    suggestions.push({
      field: 'content',
      message: 'Missing H1 heading',
      suggestion: 'Add one main H1 heading to structure your content',
    });
  }

  // Content length suggestion
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 300) {
    suggestions.push({
      field: 'content',
      message: 'Content might be too short',
      suggestion: 'Aim for 300-500+ words for better SEO performance',
      current: `${wordCount} words`,
    });
  }

  return suggestions;
}

/**
 * Get TOC for blog post preview
 */
export function getTableOfContents(content: string) {
  const result = transformAndValidateContent(content);
  return generateTableOfContents(result.headings);
}
