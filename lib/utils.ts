import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate consistent heading IDs for TOC linking
 * Also extracts manual ID if present in format: "Text {#manual-id}"
 */
export function generateHeadingId(text: string): { id: string; cleanText: string } {
  const textStr = String(text);
  
  // Check for manual ID in format {#id}
  const manualIdMatch = textStr.match(/^(.+?)\s*\{#([^}]+)\}\s*$/);
  
  if (manualIdMatch) {
    return {
      id: manualIdMatch[2].trim(),
      cleanText: manualIdMatch[1].trim()
    };
  }
  
  // Generate ID from text - consistent with table-of-contents.tsx cleanMarkdown + id generation
  const id = textStr
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')     // Remove special chars
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/-+/g, '-')                // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')            // Remove leading/trailing hyphens
    .trim();
  
  return { id, cleanText: textStr };
}


