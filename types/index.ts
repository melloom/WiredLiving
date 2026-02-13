export interface BlogPost {
  slug: string;
  title: string;
  description?: string;
  date: string;
  updatedAt?: string;
  author: string;
  tags?: string[];
  published?: boolean;
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
   * Crop settings for the cover image (for featured posts on home page)
   * Format: { x: number, y: number, width: number, height: number, zoom: number, rotation: number, aspectRatio?: string, objectPosition: string }
   */
  coverImageCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom?: number;
    rotation?: number;
    aspectRatio?: string;
    objectPosition?: string; // e.g., "center top", "50% 20%"
  };
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
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: string | Date | null;
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

  // Related content & backlinks
  relatedLinks?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;

  /**
   * Optional avatar URL for the author (used in post headers)
   */
  authorAvatar?: string;

  /**
   * Controls visibility of sidebar/mobile widgets for this post.
   */
  sidebarWidgets?: {
    showQuickLinks?: boolean;
    showTableOfContents?: boolean;
    showRelatedNews?: boolean;
    showGallery?: boolean;
    showWeather?: boolean;
    showContact?: boolean;
  };

  /**
   * Sidebar music player config. When enabled, a music player appears in the sidebar.
   * Only one music player allowed per post (sidebar OR inline content, not both).
   */
  sidebarMusicPlayer?: {
    enabled: boolean;
    src: string;
    title?: string;
    artist?: string;
  };
}

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
}

export interface SeriesMetadata {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
  color_scheme?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}
