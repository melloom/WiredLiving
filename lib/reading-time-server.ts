'use server';

import readingTime from 'reading-time';

/**
 * Server action to calculate reading time from text
 * This must be a server action because reading-time requires Node.js Stream API
 * and cannot be used in client components
 */
export async function calculateReadingTime(text: string): Promise<{ minutes: number; words: number }> {
  const stats = readingTime(text);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    minutes: Math.ceil(stats.minutes),
    words,
  };
}
