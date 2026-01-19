/**
 * Smart SEO Generator
 * Intelligently generates optimized SEO metadata from blog content
 */

interface SEOResult {
  seoTitle: string;
  seoDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  keywords: string[];
}

/**
 * Clean markdown and HTML from text
 */
function cleanText(text: string): string {
  return text
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove markdown bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove callouts/admonitions
    .replace(/^:::[\s\S]*?:::/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract keywords from content
 */
function extractKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const cleanedText = cleanText(text);
  
  // Common words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into',
  ]);

  // Extract words (2+ chars)
  const words = cleanedText
    .match(/\b[a-z]{2,}\b/g) || [];
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Smart truncate at word boundary
 */
function smartTruncate(text: string, maxLength: number, suffix: string = '…'): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength
  const truncated = text.substring(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.6) {
    // Good break point found
    return truncated.substring(0, lastSpace).trim() + suffix;
  }
  
  // No good break point, use hard truncate
  return truncated.trim() + suffix;
}

/**
 * Extract the most meaningful sentence from content
 */
function extractKeySentence(content: string): string {
  const cleaned = cleanText(content);
  
  // Split into sentences
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);
  
  if (sentences.length === 0) {
    return cleaned.substring(0, 160);
  }

  // Prefer sentences with keywords or questions
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // Boost questions
    if (sentence.includes('how') || sentence.includes('what') || sentence.includes('why')) {
      score += 3;
    }
    
    // Boost sentences with numbers
    if (/\d+/.test(sentence)) {
      score += 2;
    }
    
    // Boost medium-length sentences
    if (sentence.length > 40 && sentence.length < 120) {
      score += 2;
    }
    
    // Boost sentences with action words
    const actionWords = ['learn', 'discover', 'find', 'explore', 'understand', 'master', 'create', 'build'];
    if (actionWords.some(word => sentence.toLowerCase().includes(word))) {
      score += 2;
    }
    
    return { sentence, score };
  });

  // Return highest scored sentence
  scoredSentences.sort((a, b) => b.score - a.score);
  return scoredSentences[0].sentence;
}

/**
 * Optimize title for SEO
 */
function optimizeTitle(title: string, keywords: string[]): string {
  const cleaned = cleanText(title);
  
  // Power words that increase click-through
  const powerWords = [
    'Ultimate', 'Complete', 'Essential', 'Proven', 'Effective',
    'Simple', 'Quick', 'Easy', 'Advanced', 'Professional',
    'Best', 'Top', 'Amazing', 'Powerful', 'Smart'
  ];

  // Check if title already has power words
  const hasPowerWord = powerWords.some(word => 
    cleaned.toLowerCase().includes(word.toLowerCase())
  );

  // If too long, truncate smartly
  if (cleaned.length > 60) {
    return smartTruncate(cleaned, 60);
  }

  // If too short and no power word, try to enhance
  if (cleaned.length < 40 && !hasPowerWord && keywords.length > 0) {
    // Try adding "Guide to" or similar
    const enhancements = ['Guide to', 'Introduction to', 'Understanding'];
    for (const enhancement of enhancements) {
      const enhanced = `${enhancement} ${cleaned}`;
      if (enhanced.length <= 60) {
        return enhanced;
      }
    }
  }

  return cleaned;
}

/**
 * Create compelling meta description
 */
function createDescription(title: string, description: string, content: string): string {
  // Priority: use provided description, otherwise extract from content
  const baseText = description 
    ? cleanText(description)
    : extractKeySentence(content);

  if (baseText.length <= 160) {
    return baseText;
  }

  // Smart truncate
  return smartTruncate(baseText, 160);
}

/**
 * Create Twitter-optimized variants
 */
function createTwitterVariants(seoTitle: string, seoDescription: string) {
  // Twitter allows slightly longer text and benefits from emoji
  const twitterTitle = seoTitle.length <= 70 
    ? seoTitle 
    : smartTruncate(seoTitle, 70);

  const twitterDescription = seoDescription.length <= 200 
    ? seoDescription 
    : smartTruncate(seoDescription, 200);

  return { twitterTitle, twitterDescription };
}

/**
 * Main function to generate all SEO metadata
 */
export function generateSmartSEO(
  title: string,
  description: string,
  content: string,
  category?: string
): SEOResult {
  // Validate inputs
  if (!title || !title.trim()) {
    return {
      seoTitle: 'Untitled Post',
      seoDescription: 'No description available',
      twitterTitle: 'Untitled Post',
      twitterDescription: 'No description available',
      keywords: [],
    };
  }

  // Clean inputs
  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  const cleanContent = cleanText(content);

  // Extract keywords
  const keywords = extractKeywords(cleanTitle, cleanContent);

  // Generate optimized title
  const seoTitle = optimizeTitle(cleanTitle, keywords);

  // Generate description
  const seoDescription = createDescription(cleanTitle, cleanDescription, cleanContent);

  // Generate Twitter variants
  const { twitterTitle, twitterDescription } = createTwitterVariants(seoTitle, seoDescription);

  return {
    seoTitle,
    seoDescription,
    twitterTitle,
    twitterDescription,
    keywords,
  };
}

/**
 * Quick validation of SEO quality
 */
export function validateSEO(seo: SEOResult): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Title checks
  if (seo.seoTitle.length < 30) {
    warnings.push('SEO title is quite short - aim for 50-60 characters for better visibility');
  }
  if (seo.seoTitle.length > 60) {
    warnings.push('SEO title may be truncated in search results');
  }

  // Description checks
  if (seo.seoDescription.length < 120) {
    warnings.push('SEO description is short - aim for 140-160 characters');
  }
  if (seo.seoDescription.length > 160) {
    warnings.push('SEO description may be truncated');
  }

  // Check for duplicate title/description
  if (seo.seoTitle === seo.seoDescription) {
    warnings.push('Title and description should be different');
  }

  // Check for generic content
  if (seo.seoTitle.includes('Untitled') || seo.seoDescription.includes('No description')) {
    warnings.push('SEO content appears to be placeholder text');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
