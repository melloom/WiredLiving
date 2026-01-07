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
   * Whether this post is highlighted (for featured carousels, etc.).
   */
  featured?: boolean;
  /**
   * SEO-specific title/description (fallbacks to title/description if missing).
   */
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
}

