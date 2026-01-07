export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
  content?: string;
  readingTime?: number;
  wordCount?: number;

  // Enhanced model fields
  /**
   * Short teaser used on cards and lists.
   * If not set, UI can fall back to description.
   */
  excerpt?: string;
  /**
   * URL of the cover/hero image for the post.
   */
  coverImage?: string;
  /**
   * Additional images associated with this post (inline, galleries, callouts).
   * These are stored as URLs (typically from Blob storage).
   */
  galleryImages?: string[];
  /**
   * Whether this post is highlighted (for featured carousels, etc.).
   */
  featured?: boolean;
  /**
   * SEO-specific title/description (fallbacks to title/description if missing).
   */
  seoTitle?: string;
  seoDescription?: string;
  ogImageOverride?: string;
  twitterTitle?: string;
  twitterDescription?: string;

  // Publishing & visibility
  status?: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string | null;
  visibility?: 'public' | 'unlisted' | 'private';
  isPremium?: boolean;
  requiresLogin?: boolean;

  // Structure & canonical
  category?: string;
  series?: string;
  seriesOrder?: number | null;
  canonicalUrl?: string;
  structuredDataType?: 'BlogPosting' | 'NewsArticle' | 'Product' | string;

  // Slug control
  slugOverride?: string;
  slugLocked?: boolean;
}

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
}

