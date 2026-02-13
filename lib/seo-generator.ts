/**
 * Smart SEO Generator - Advanced Edition  
 * AI-powered SEO metadata generation with formulas, power words, and scoring
 */

interface SEOResult {
  seoTitle: string;
  seoDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  keywords: string[];
  seoScore?: number;
  titleVariations?: string[];
  suggestions?: string[];
}

interface SEOScore {
  score: number;
  breakdown: {
    titleLength: number;
    descriptionLength: number;
    keywordUsage: number;
    readability: number;
    engagement: number;
  };
  suggestions: string[];
}

/**
 * Advanced power words categorized by emotion/impact
 */
const POWER_WORDS = {
  urgency: ['Now', 'Today', 'Fast', 'Quick', 'Instant', 'Immediately'],
  value: ['Free', 'Essential', 'Vital', 'Critical', 'Important', 'Crucial'],
  quality: ['Best', 'Top', 'Ultimate', 'Perfect', 'Ideal', 'Premier', 'Elite'],
  ease: ['Easy', 'Simple', 'Effortless', 'Quick', 'Fast', 'Straightforward'],
  proof: ['Proven', 'Tested', 'Verified', 'Certified', 'Guaranteed', 'Science-backed'],
  exclusivity: ['Secret', 'Exclusive', 'Limited', 'Members-only', 'Insider', 'Private'],
  curiosity: ['Surprising', 'Amazing', 'Shocking', 'Incredible', 'Remarkable', 'Stunning'],
  achievement: ['Master', 'Expert', 'Pro', 'Advanced', 'Complete', 'Comprehensive'],
};

/**
 * Call-to-action phrases for descriptions
 */
const CTA_PHRASES = [
  'Learn how',
  'Discover',
  'Find out',
  'Get started',
  'Explore',
  'Master',
  'Unlock',
  'See how',
];

/**
 * Clean markdown and HTML from text
 */
function cleanText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^:::[\s\S]*?:::/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract keywords from content
 */
function extractKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const cleanedText = cleanText(text);
  
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

  const words = cleanedText.match(/\b[a-z]{2,}\b/g) || [];
  
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Smart truncate at word boundary
 */
function smartTruncate(text: string, maxLength: number, suffix: string = '…'): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace).trim() + suffix;
  }
  
  return truncated.trim() + suffix;
}

/**
 * Detect if title is a question
 */
function isQuestion(text: string): boolean {
  return /^(how|what|why|when|where|who|which|can|should|do|does|is|are)\s/i.test(text) || text.endsWith('?');
}

/**
 * Extract numbers from text
 */
function extractNumbers(text: string): string[] {
  return text.match(/\d+/g) || [];
}

/**
 * Check if title has power words
 */
function hasPowerWords(text: string): { has: boolean; words: string[] } {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  Object.values(POWER_WORDS).flat().forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      found.push(word);
    }
  });
  
  return { has: found.length > 0, words: found };
}

/**
 * Check if text starts with CTA
 */
function hasCTA(text: string): boolean {
  return CTA_PHRASES.some(cta => 
    text.toLowerCase().startsWith(cta.toLowerCase())
  );
}

/**
 * Extract the most meaningful sentence from content
 */
function extractKeySentence(content: string): string {
  const cleaned = cleanText(content);
  
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);
  
  if (sentences.length === 0) {
    return cleaned.substring(0, 160);
  }

  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    if (sentence.includes('how') || sentence.includes('what') || sentence.includes('why')) score += 3;
    if (/\d+/.test(sentence)) score += 2;
    if (sentence.length > 40 && sentence.length < 120) score += 2;
    
    const actionWords = ['learn', 'discover', 'find', 'explore', 'understand', 'master', 'create', 'build'];
    if (actionWords.some(word => sentence.toLowerCase().includes(word))) score += 2;
    
    return { sentence, score };
  });

  scoredSentences.sort((a, b) => b.score - a.score);
  return scoredSentences[0].sentence;
}

/**
 * Generate title variations using proven formulas
 */
function generateTitleVariations(title: string, keywords: string[]): string[] {
  const cleaned = cleanText(title);
  const variations: string[] = [cleaned];
  const numbers = extractNumbers(cleaned);
  const topKeyword = keywords[0] || '';
  
  if (cleaned.length < 50) {
    if (!isQuestion(cleaned)) {
      variations.push(`How to ${cleaned}`);
    }
    
    variations.push(`${cleaned}: Complete Guide`);
    
    if (numbers.length === 0 && topKeyword) {
      variations.push(`7 Ways to ${cleaned}`);
      variations.push(`10 Tips for ${cleaned}`);
    }
    
    variations.push(`Ultimate Guide to ${cleaned}`);
  }
  
  return [...new Set(variations)]
    .filter(v => v.length <= 60 && v.length >= 30)
    .slice(0, 3);
}

/**
 * Optimize title for SEO with advanced formulas
 */
function optimizeTitle(title: string, keywords: string[]): string {
  const cleaned = cleanText(title);
  
  if (cleaned.length > 60) {
    return smartTruncate(cleaned, 60);
  }

  const { has: hasPower } = hasPowerWords(cleaned);
  const hasNumber = extractNumbers(cleaned).length > 0;
  const isQ = isQuestion(cleaned);
  
  if (isQ || hasNumber || hasPower) {
    return cleaned;
  }
  
  if (cleaned.length < 35 && keywords.length > 0) {
    const enhancements = [
      `Complete Guide to ${cleaned}`,
      `Mastering ${cleaned}`,
      `${cleaned}: Essential Tips`,
      `How to Master ${cleaned}`,
    ];
    
    for (const enhanced of enhancements) {
      if (enhanced.length >= 40 && enhanced.length <= 60) {
        return enhanced;
      }
    }
  }

  return cleaned;
}

/**
 * Add CTA to description if missing
 */
function addCTA(text: string, keywords: string[]): string {
  if (hasCTA(text) || text.length > 140) {
    return text;
  }
  
  const topKeyword = keywords[0];
  if (topKeyword && text.length < 120) {
    return `Discover ${text.toLowerCase()}`;
  }
  
  return text;
}

/**
 * Create compelling meta description with CTA
 */
function createDescription(title: string, description: string, content: string, keywords: string[] = []): string {
  let baseText = description 
    ? cleanText(description)
    : extractKeySentence(content);

  if (baseText.length < 140 && !hasCTA(baseText)) {
    const withCTA = addCTA(baseText, keywords);
    if (withCTA.length <= 160) {
      baseText = withCTA;
    }
  }

  if (baseText.length <= 160) {
    return baseText;
  }

  return smartTruncate(baseText, 160);
}

/**
 * Create Twitter-optimized variants
 */
function createTwitterVariants(seoTitle: string, seoDescription: string) {
  const twitterTitle = seoTitle.length <= 70 
    ? seoTitle 
    : smartTruncate(seoTitle, 70);

  const twitterDescription = seoDescription.length <= 200 
    ? seoDescription 
    : smartTruncate(seoDescription, 200);

  return { twitterTitle, twitterDescription };
}

/**
 * Calculate SEO score (0-100)
 */
function calculateSEOScore(seo: SEOResult): SEOScore {
  let score = 0;
  const suggestions: string[] = [];
  const breakdown = {
    titleLength: 0,
    descriptionLength: 0,
    keywordUsage: 0,
    readability: 0,
    engagement: 0,
  };

  // Title length scoring (20 points)
  if (seo.seoTitle.length >= 50 && seo.seoTitle.length <= 60) {
    breakdown.titleLength = 20;
  } else if (seo.seoTitle.length >= 40 && seo.seoTitle.length < 50) {
    breakdown.titleLength = 15;
    suggestions.push('Title could be longer (aim for 50-60 chars)');
  } else if (seo.seoTitle.length > 60) {
    breakdown.titleLength = 10;
    suggestions.push('Title is too long (may be truncated in search results)');
  } else {
    breakdown.titleLength = 5;
    suggestions.push('Title is too short (aim for 50-60 chars)');
  }

  // Description length scoring (20 points)
  if (seo.seoDescription.length >= 140 && seo.seoDescription.length <= 160) {
    breakdown.descriptionLength = 20;
  } else if (seo.seoDescription.length >= 120 && seo.seoDescription.length < 140) {
    breakdown.descriptionLength = 15;
    suggestions.push('Description could be longer (aim for 140-160 chars)');
  } else if (seo.seoDescription.length > 160) {
    breakdown.descriptionLength = 10;
    suggestions.push('Description may be truncated in search results');
  } else {
    breakdown.descriptionLength = 5;
    suggestions.push('Description is too short (aim for 140-160 chars)');
  }

  // Keyword usage (20 points)
  const titleLower = seo.seoTitle.toLowerCase();
  const descLower = seo.seoDescription.toLowerCase();
  const topKeywords = seo.keywords.slice(0, 3);
  let keywordMatches = 0;
  
  topKeywords.forEach(keyword => {
    if (titleLower.includes(keyword)) keywordMatches++;
    if (descLower.includes(keyword)) keywordMatches++;
  });
  
  breakdown.keywordUsage = Math.min(20, keywordMatches * 4);
  if (breakdown.keywordUsage < 15) {
    suggestions.push('Include more relevant keywords in title/description');
  }

  // Readability (20 points)
  const titleWords = seo.seoTitle.split(/\s+/).length;
  const descWords = seo.seoDescription.split(/\s+/).length;
  
  if (titleWords >= 6 && titleWords <= 12) breakdown.readability += 10;
  if (descWords >= 15 && descWords <= 25) breakdown.readability += 10;
  
  if (breakdown.readability < 15) {
    suggestions.push('Improve readability (aim for 6-12 words in title, 15-25 in description)');
  }

  // Engagement factors (20 points)
  const { has: titleHasPower } = hasPowerWords(seo.seoTitle);
  const { has: descHasPower } = hasPowerWords(seo.seoDescription);
  const titleIsQuestion = isQuestion(seo.seoTitle);
  const titleHasNumber = extractNumbers(seo.seoTitle).length > 0;
  const descHasCTACheck = hasCTA(seo.seoDescription);
  
  if (titleHasPower) breakdown.engagement += 5;
  if (descHasPower) breakdown.engagement += 3;
  if (titleIsQuestion) breakdown.engagement += 5;
  if (titleHasNumber) breakdown.engagement += 4;
  if (descHasCTACheck) breakdown.engagement += 3;
  
  if (breakdown.engagement < 12) {
    suggestions.push('Add power words, numbers, or questions to boost engagement');
  }

  score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { score, breakdown, suggestions };
}

/**
 * Main function to generate all SEO metadata with advanced features
 */
export function generateSmartSEO(
  title: string,
  description: string,
  content: string,
  category?: string,
  options: { generateVariations?: boolean; includeScore?: boolean } = {}
): SEOResult {
  if (!title || !title.trim()) {
    return {
      seoTitle: 'Untitled Post',
      seoDescription: 'No description available',
      twitterTitle: 'Untitled Post',
      twitterDescription: 'No description available',
      keywords: [],
      seoScore: 0,
    };
  }

  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  const cleanContent = cleanText(content);

  const keywords = extractKeywords(cleanTitle, cleanContent);

  const seoTitle = optimizeTitle(cleanTitle, keywords);

  const seoDescription = createDescription(cleanTitle, cleanDescription, cleanContent, keywords);

  const { twitterTitle, twitterDescription } = createTwitterVariants(seoTitle, seoDescription);

  const result: SEOResult = {
    seoTitle,
    seoDescription,
    twitterTitle,
    twitterDescription,
    keywords,
  };

  if (options.generateVariations) {
    result.titleVariations = generateTitleVariations(cleanTitle, keywords);
  }

  if (options.includeScore) {
    const scoreData = calculateSEOScore(result);
    result.seoScore = scoreData.score;
    result.suggestions = scoreData.suggestions;
  }

  return result;
}

/**
 * Quick validation of SEO quality
 */
export function validateSEO(seo: SEOResult): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (seo.seoTitle.length < 30) {
    warnings.push('SEO title is quite short - aim for 50-60 characters for better visibility');
  }
  if (seo.seoTitle.length > 60) {
    warnings.push('SEO title may be truncated in search results');
  }

  if (seo.seoDescription.length < 120) {
    warnings.push('SEO description is short - aim for 140-160 characters');
  }
  if (seo.seoDescription.length > 160) {
    warnings.push('SEO description may be truncated');
  }

  if (seo.seoTitle === seo.seoDescription) {
    warnings.push('Title and description should be different');
  }

  if (seo.seoTitle.includes('Untitled') || seo.seoDescription.includes('No description')) {
    warnings.push('SEO content appears to be placeholder text');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
