import { supabase, isSupabaseConfigured } from './supabase';
import { BlogPost } from '@/types';
import readingTime from 'reading-time';

/**
 * Get all posts from database (including drafts) - for admin use
 */
export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // Get ALL posts (published and drafts) for admin
    const { data: posts, error: postsError } = await supabase!
      .from('posts')
      .select('*')
      .order('date', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // Get tags for all posts
    const postIds = posts.map(p => p.id);
    const { data: postTags, error: tagsError } = await supabase!
      .from('post_tags')
      .select(`
        post_id,
        tags (
          name
        )
      `)
      .in('post_id', postIds);

    if (tagsError) {
      console.warn('Error fetching tags:', tagsError);
    }

    // Map tags to posts
    const tagsMap = new Map<string, string[]>();
    if (postTags) {
      postTags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name) {
          const existing = tagsMap.get(pt.post_id) || [];
          tagsMap.set(pt.post_id, [...existing, pt.tags.name]);
        }
      });
    }

    return posts.map((post: any) => {
      const tags = tagsMap.get(post.id) || [];
      return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get all published posts from database
 */
export async function getAllPosts(limit?: number): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // First get all published posts
    // Posts are published if either 'published' flag is true OR 'status' is 'published'
    let query = supabase!
      .from('posts')
      .select('*')
      .or('published.eq.true,status.eq.published')
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // Get tags for all posts
    const postIds = posts.map(p => p.id);
    const { data: postTags, error: tagsError } = await supabase!
      .from('post_tags')
      .select(`
        post_id,
        tags (
          name
        )
      `)
      .in('post_id', postIds);

    if (tagsError) {
      console.warn('Error fetching tags:', tagsError);
    }

    // Map tags to posts
    const tagsMap = new Map<string, string[]>();
    if (postTags) {
      postTags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name) {
          const existing = tagsMap.get(pt.post_id) || [];
          tagsMap.set(pt.post_id, [...existing, pt.tags.name]);
        }
      });
    }

    return posts.map((post: any) => {
      const tags = tagsMap.get(post.id) || [];
      return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get featured posts (posts marked as featured in database)
 */
export async function getFeaturedPosts(limit: number = 3): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: posts, error: postsError } = await supabase!
      .from('posts')
      .select('*')
      .eq('featured', true)
      .or('published.eq.true,status.eq.published')
      .order('date', { ascending: false })
      .limit(limit);

    if (postsError) {
      console.error('Error fetching featured posts:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      // If no featured posts, return latest posts
      return getAllPosts(limit);
    }

    // Get tags for all posts
    const postIds = posts.map(p => p.id);
    const { data: postTags, error: tagsError } = await supabase!
      .from('post_tags')
      .select(`
        post_id,
        tags (
          name
        )
      `)
      .in('post_id', postIds);

    if (tagsError) {
      console.warn('Error fetching tags:', tagsError);
    }

    // Map tags to posts
    const tagsMap = new Map<string, string[]>();
    if (postTags) {
      postTags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name) {
          const existing = tagsMap.get(pt.post_id) || [];
          tagsMap.set(pt.post_id, [...existing, pt.tags.name]);
        }
      });
    }

    return posts.map((post: any) => {
      const tags = tagsMap.get(post.id) || [];
      return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
    });
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    return getAllPosts(limit);
  }
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: post, error: postError } = await supabase!
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (postError || !post) {
      return null;
    }

    // Get tags for this post
    const { data: postTags } = await supabase!
      .from('post_tags')
      .select(`
        tags (
          name
        )
      `)
      .eq('post_id', post.id);

    const tags = postTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
    return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Get a post by slug regardless of published status (for previews)
 */
export async function getPostBySlugAny(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured in getPostBySlugAny');
    return null;
  }

  try {
    // Clean and normalize the slug
    const cleanSlug = slug.trim();
    console.log('getPostBySlugAny - searching for slug:', cleanSlug);

    // Try exact match first
    let { data: post, error: postError } = await supabase!
      .from('posts')
      .select('*')
      .eq('slug', cleanSlug)
      .single();

    // If not found, try decoding (in case it was double-encoded)
    if (postError && cleanSlug !== decodeURIComponent(cleanSlug)) {
      const decodedSlug = decodeURIComponent(cleanSlug);
      console.log('Trying decoded slug:', decodedSlug);
      const result = await supabase!
        .from('posts')
        .select('*')
        .eq('slug', decodedSlug)
        .single();
      post = result.data;
      postError = result.error;
    }

    if (postError) {
      console.error('Error fetching post by slug:', postError);
      // If it's a "not found" error, that's okay - return null
      if (postError.code === 'PGRST116' || postError.message?.includes('No rows')) {
        console.log('Post not found in database for slug:', cleanSlug);
        // Try to list all slugs for debugging
        const { data: allPosts } = await supabase!
          .from('posts')
          .select('slug, title, status')
          .limit(10);
        console.log('Available posts (first 10):', allPosts);
        return null;
      }
      return null;
    }

    if (!post) {
      console.log('No post returned for slug:', cleanSlug);
      return null;
    }

    console.log('Post found:', { id: post.id, slug: post.slug, title: post.title, status: post.status });

    // Get tags for this post
    const { data: postTags } = await supabase!
      .from('post_tags')
      .select(`
        tags (
          name
        )
      `)
      .eq('post_id', post.id);

    const tags = postTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
    return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
  } catch (error) {
    console.error('Error fetching post (any status):', error);
    return null;
  }
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tagName: string): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // First get the tag ID
    const { data: tagData, error: tagError } = await supabase!
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError || !tagData) {
      return [];
    }

    // Get post IDs with this tag
    const { data: postTags, error: ptError } = await supabase!
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tagData.id);

    if (ptError || !postTags || postTags.length === 0) {
      return [];
    }

    const postIds = postTags.map(pt => pt.post_id);

    // Get posts
    const { data: posts, error: postsError } = await supabase!
      .from('posts')
      .select('*')
      .eq('published', true)
      .in('id', postIds)
      .order('date', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts by tag:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // Get all tags for these posts
    const { data: allPostTags } = await supabase!
      .from('post_tags')
      .select(`
        post_id,
        tags (
          name
        )
      `)
      .in('post_id', postIds);

    const tagsMap = new Map<string, string[]>();
    if (allPostTags) {
      allPostTags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name) {
          const existing = tagsMap.get(pt.post_id) || [];
          tagsMap.set(pt.post_id, [...existing, pt.tags.name]);
        }
      });
    }

    return posts.map((post: any) => {
      const tags = tagsMap.get(post.id) || [];
      return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
    });
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    return [];
  }
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: tags, error } = await supabase!
      .from('tags')
      .select('name')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return (tags || []).map((tag: any) => tag.name);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Transform database row to BlogPost type
 */
function transformPostRow(row: any): BlogPost {
  // Handle tags from Supabase relationship
  let tags: string[] = [];
  if (row.post_tags && Array.isArray(row.post_tags)) {
    tags = row.post_tags
      .map((pt: any) => pt.tags?.name)
      .filter(Boolean);
  }

  // Calculate reading time if not stored
  const readingTimeMinutes = row.reading_time
    ? row.reading_time
    : Math.ceil(readingTime(row.content || '').minutes);
  const wordCount = row.content ? row.content.split(/\s+/).filter(Boolean).length : undefined;

  return {
    slug: row.slug,
    slugOverride: row.slug_override || undefined,
    slugLocked: !!row.slug_locked,
    title: row.title,
    description: row.description || '',
    date: row.date,
    author: row.author,
    tags,
    published: row.published,
    status: row.status || (row.published ? 'published' : 'draft'),
    scheduledAt: row.scheduled_at || null,
    visibility: row.visibility || 'public',
    isPremium: !!row.is_premium,
    requiresLogin: !!row.requires_login,
    content: row.content,
    readingTime: readingTimeMinutes,
    wordCount,
    excerpt: row.excerpt || row.description || '',
    coverImage: row.cover_image || '/MAIN PIC.png',
    coverImageCrop: row.cover_image_crop ? (
      typeof row.cover_image_crop === 'string'
        ? JSON.parse(row.cover_image_crop)
        : row.cover_image_crop
    ) : undefined,
    galleryImages: Array.isArray(row.gallery_images)
      ? row.gallery_images
      : row.gallery_images
      ? (() => {
          try {
            const parsed = typeof row.gallery_images === 'string'
              ? JSON.parse(row.gallery_images)
              : row.gallery_images;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [],
    featured: typeof row.featured === 'boolean' ? row.featured : false,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    ogImageOverride: row.og_image_override || undefined,
    twitterTitle: row.twitter_title || undefined,
    twitterDescription: row.twitter_description || undefined,
    category: row.category || undefined,
    series: row.series || undefined,
    seriesOrder: row.series_order ?? null,
    canonicalUrl: row.canonical_url || undefined,
    structuredDataType: row.structured_data_type || undefined,
    relatedLinks: Array.isArray(row.related_links)
      ? row.related_links
      : row.related_links
      ? (() => {
          try {
            const parsed = typeof row.related_links === 'string'
              ? JSON.parse(row.related_links)
              : row.related_links;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [],
    sidebarMusicPlayer: row.sidebar_music_player ? (
      typeof row.sidebar_music_player === 'string'
        ? JSON.parse(row.sidebar_music_player)
        : row.sidebar_music_player
    ) : undefined,
  };
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Check if database tables exist
 */
async function checkTablesExist(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase!
      .from('posts')
      .select('id')
      .limit(1);

    // If we can query the table, it exists
    return !error;
  } catch {
    return false;
  }
}

/**
 * Create a new post (admin function)
 */
export async function createPost(post: Omit<BlogPost, 'slug'> & { slug?: string }): Promise<BlogPost | null> {
  try {
    console.log('createPost called with:', { title: post.title, hasContent: !!post.content });

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
    }

    // Check if tables exist, if not, try to initialize
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.warn('Database tables do not exist, attempting to initialize...');
      try {
        await initDatabase();
        console.log('Database initialized successfully');
      } catch (initError) {
        console.error('Failed to auto-initialize database:', initError);
        throw new Error('Database tables do not exist. Please visit /api/init-db to initialize the database schema.');
      }
    }

    const slug = post.slug || post.slugOverride || generateSlug(post.title);
    console.log('Generated slug:', slug);

    const readingStats = readingTime(post.content || '');
    const readingTimeMinutes = Math.ceil(readingStats.minutes);
    const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : null;

    console.log('About to execute database insert...');

    // Prepare post data for Supabase
    const postData = {
      slug,
      slug_override: post.slugOverride || null,
      slug_locked: post.slugLocked ?? false,
      title: post.title,
      description: post.description || '',
      content: post.content || '',
      author: post.author,
      date: post.date,
      published: post.published ?? false,
      status: post.status || (post.published ? 'published' : 'draft'),
      scheduled_at: post.scheduledAt || null,
      visibility: post.visibility || 'public',
      is_premium: post.isPremium ?? false,
      requires_login: post.requiresLogin ?? false,
      reading_time: readingTimeMinutes,
      word_count: wordCount,
      excerpt: post.excerpt || null,
      cover_image: post.coverImage || null,
      cover_image_crop: post.coverImageCrop || null,
      featured: post.featured ?? false,
      seo_title: post.seoTitle || null,
      seo_description: post.seoDescription || null,
      og_image_override: post.ogImageOverride || null,
      twitter_title: post.twitterTitle || null,
      twitter_description: post.twitterDescription || null,
      gallery_images: post.galleryImages || [],
      category: post.category || null,
      series: post.series || null,
      series_order: post.seriesOrder ?? null,
      canonical_url: post.canonicalUrl || null,
      structured_data_type: post.structuredDataType || null,
      related_links: post.relatedLinks || [],
      sidebar_music_player: post.sidebarMusicPlayer || null,
    };

    const { data: insertedPost, error: insertError } = await supabase!
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (insertError || !insertedPost) {
      console.error('Database insert error:', insertError);
      throw new Error(insertError?.message || 'Failed to insert post');
    }

    console.log('Insert successful, post ID:', insertedPost.id);
    const postId = insertedPost.id;

    // Sync tags if provided
    if (post.tags && post.tags.length > 0) {
      await syncPostTags(postId, post.tags);
    }

    // Fetch the complete post with tags
    console.log('Fetching created post with slug:', slug);
    const createdPost = await getPostBySlugAny(slug);

    if (!createdPost) {
      console.warn('Post created but could not be retrieved, constructing from insert data');
      // Return a basic post object constructed from the inserted data
      return {
        slug,
        title: post.title,
        description: post.description || '',
        date: post.date,
        author: post.author,
        tags: post.tags || [],
        published: post.published ?? false,
        content: post.content,
        readingTime: readingTimeMinutes,
        wordCount: wordCount || undefined,
        status: post.status || (post.published ? 'published' : 'draft'),
        scheduledAt: post.scheduledAt || null,
        visibility: post.visibility || 'public',
        isPremium: post.isPremium ?? false,
        requiresLogin: post.requiresLogin ?? false,
        excerpt: post.excerpt || '',
        coverImage: post.coverImage || undefined,
        featured: post.featured ?? false,
        seoTitle: post.seoTitle || undefined,
        seoDescription: post.seoDescription || undefined,
        ogImageOverride: post.ogImageOverride || undefined,
        twitterTitle: post.twitterTitle || undefined,
        twitterDescription: post.twitterDescription || undefined,
        category: post.category || undefined,
        series: post.series || undefined,
        seriesOrder: post.seriesOrder ?? null,
        canonicalUrl: post.canonicalUrl || undefined,
        structuredDataType: post.structuredDataType || undefined,
        slugOverride: post.slugOverride || undefined,
        slugLocked: post.slugLocked ?? false,
        galleryImages: post.galleryImages || [],
      } as BlogPost;
    }

    console.log('Successfully created post:', { slug: createdPost.slug, title: createdPost.title });
    return createdPost;
  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Sync tags for a post
 */
async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    // Try to get existing tag
    const { data: existingTags } = await supabase!
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .limit(1)
      .single();

    let tagId: string;

    if (existingTags) {
      tagId = existingTags.id;
    } else {
      // Create new tag
      const { data: newTag, error } = await supabase!
        .from('tags')
        .insert({ name: tagName })
        .select('id')
        .single();

      if (error || !newTag) {
        console.error('Error creating tag:', error);
        continue;
      }
      tagId = newTag.id;
    }

    tagIds.push(tagId);
  }

  // Delete existing post_tags
  await supabase!
    .from('post_tags')
    .delete()
    .eq('post_id', postId);

  // Insert new post_tags
  if (tagIds.length > 0) {
    const postTagInserts = tagIds.map(tagId => ({
      post_id: postId,
      tag_id: tagId,
    }));

    await supabase!
      .from('post_tags')
      .insert(postTagInserts);
  }
}

/**
 * Admin audit logging
 */
export type AdminActionType = 'create_post' | 'update_post' | 'delete_post' | 'login' | 'other';

export async function logAdminAction(params: {
  userEmail: string;
  action: AdminActionType;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { userEmail, action, targetType, targetId, ip, userAgent, meta } = params;

    await supabase!
      .from('admin_logs')
      .insert({
        user_email: userEmail,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        ip: ip || null,
        user_agent: userAgent || null,
        meta: meta || null,
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

/**
 * Test database connection
 */
async function testConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    console.log('Testing database connection...');
    const { error } = await supabase!
      .from('posts')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" - that's okay for connection test
      console.error('Database connection test failed:', error);
      return false;
    }

    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get SQL schema for database initialization
 *
 * Note: This returns a basic schema. For the full secure schema with RLS policies,
 * see supabase-schema.sql in the project root.
 */
export function getDatabaseSchemaSQL(): string {
  // Read the full secure schema from the file
  // For now, return a note pointing to the file
  // In production, you might want to read the file or include it here
  return `
-- ⚠️ IMPORTANT: Use the full secure schema from supabase-schema.sql
-- This includes Row Level Security (RLS) policies, user management, and security features
--
-- For the complete secure schema, see: supabase-schema.sql
-- Or visit: https://github.com/your-repo/blob/main/supabase-schema.sql
--
-- Basic schema (use supabase-schema.sql for production):

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  slug_override TEXT,
  slug_locked BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  is_premium BOOLEAN DEFAULT false,
  requires_login BOOLEAN DEFAULT false,
  reading_time INTEGER,
  word_count INTEGER,
  excerpt TEXT,
  cover_image TEXT,
  featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image_override TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  gallery_images JSONB,
  category TEXT,
  series TEXT,
  series_order INTEGER,
  canonical_url TEXT,
  structured_data_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create_post', 'update_post', 'delete_post', 'login', 'logout', 'other')),
  target_type TEXT,
  target_id TEXT,
  ip TEXT,
  user_agent TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_email ON admin_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ⚠️ For production, run the full schema from supabase-schema.sql which includes:
-- - Row Level Security (RLS) policies
-- - Users table for authentication
-- - Session management
-- - Security functions and triggers
-- - Additional security indexes
`;
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: posts, error: postsError } = await supabase!
      .from('posts')
      .select('*')
      .eq('published', true)
      .eq('status', 'published')
      .eq('category', category)
      .order('date', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts by category:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // Get tags for all posts
    const postIds = posts.map(p => p.id);
    const { data: postTags, error: tagsError } = await supabase!
      .from('post_tags')
      .select(`
        post_id,
        tags (
          name
        )
      `)
      .in('post_id', postIds);

    if (tagsError) {
      console.warn('Error fetching tags:', tagsError);
    }

    const tagsMap = new Map<string, string[]>();
    if (postTags) {
      postTags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name) {
          const existing = tagsMap.get(pt.post_id) || [];
          tagsMap.set(pt.post_id, [...existing, pt.tags.name]);
        }
      });
    }

    return posts.map((post: any) => {
      const tags = tagsMap.get(post.id) || [];
      return transformPostRow({ ...post, post_tags: tags.map((name: string) => ({ tags: { name } })) });
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('posts')
      .select('category')
      .eq('published', true)
      .eq('status', 'published')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = new Set<string>();
    data?.forEach((post: any) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get post likes count
 */
export async function getPostLikesCount(postId: string, reactionType: string = 'like'): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const { count, error } = await supabase!
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('reaction_type', reactionType);

    if (error) {
      console.error('Error fetching likes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching likes count:', error);
    return 0;
  }
}

/**
 * Check if user has liked a post
 */
export async function hasUserLikedPost(postId: string, userIdentifier: string, reactionType: string = 'like'): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase!
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_identifier', userIdentifier)
      .eq('reaction_type', reactionType)
      .limit(1);

    if (error) {
      console.error('Error checking like:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking like:', error);
    return false;
  }
}

/**
 * Toggle post like
 */
export async function togglePostLike(postId: string, userIdentifier: string, reactionType: string = 'like'): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Check if already liked
    const hasLiked = await hasUserLikedPost(postId, userIdentifier, reactionType);

    if (hasLiked) {
      // Unlike
      const { error } = await supabase!
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_identifier', userIdentifier)
        .eq('reaction_type', reactionType);

      if (error) {
        console.error('Error unliking post:', error);
        return false;
      }
      return false;
    } else {
      // Like
      const { error } = await supabase!
        .from('post_likes')
        .insert({
          post_id: postId,
          user_identifier: userIdentifier,
          reaction_type: reactionType,
        });

      if (error) {
        console.error('Error liking post:', error);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
}

/**
 * Get post revisions
 */
export async function getPostRevisions(postId: string): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('post_revisions')
      .select('*')
      .eq('post_id', postId)
      .order('revision_number', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return [];
  }
}

/**
 * Save reading history
 */
export async function saveReadingHistory(
  postId: string,
  userIdentifier: string,
  progressPercentage: number,
  timeSpentSeconds: number = 0
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase!
      .from('reading_history')
      .upsert({
        post_id: postId,
        user_identifier: userIdentifier,
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        time_spent_seconds: timeSpentSeconds,
        last_read_at: new Date().toISOString(),
      }, {
        onConflict: 'post_id,user_identifier',
      });

    if (error) {
      console.error('Error saving reading history:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving reading history:', error);
    return false;
  }
}

/**
 * Get reading history for a user
 */
export async function getReadingHistory(userIdentifier: string, limit: number = 20): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('reading_history')
      .select(`
        *,
        posts (
          id,
          slug,
          title,
          description,
          cover_image
        )
      `)
      .eq('user_identifier', userIdentifier)
      .order('last_read_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reading history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return [];
  }
}

/**
 * Initialize database schema (run once)
 * Note: Supabase requires DDL to be run in the SQL editor
 */
export async function initDatabase(): Promise<void> {
  console.log('initDatabase() called');

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
  }

  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    throw new Error('Cannot connect to database. Please check your Supabase credentials.');
  }

  try {
    // Check if tables exist
    const { error: postsError } = await supabase!
      .from('posts')
      .select('id')
      .limit(1);

    if (postsError && postsError.code === 'PGRST116') {
      // Table doesn't exist - provide SQL to run
      const sql = getDatabaseSchemaSQL();
      console.log('\n=== SQL TO RUN IN SUPABASE DASHBOARD ===');
      console.log(sql);
      console.log('=== END SQL ===\n');

      throw new Error(
        'Database tables do not exist. Please:\n' +
        '1. Go to your Supabase dashboard\n' +
        '2. Navigate to SQL Editor\n' +
        '3. Run the SQL shown in the server logs above\n' +
        '4. Then try again'
      );
    }

    if (postsError) {
      throw new Error(`Database error: ${postsError.message}`);
    }

    console.log('Database tables exist and are accessible');
    console.log('Database initialization check completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

/**
 * Get all series metadata
 */
export async function getAllSeriesMetadata(): Promise<import('@/types').SeriesMetadata[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase!
      .from('series_metadata')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching series metadata:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching series metadata:', error);
    return [];
  }
}

/**
 * Get series metadata by name
 */
export async function getSeriesMetadata(seriesName: string): Promise<import('@/types').SeriesMetadata | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from('series_metadata')
      .select('*')
      .eq('name', seriesName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, not an error
        return null;
      }
      console.error('Error fetching series metadata:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching series metadata:', error);
    return null;
  }
}
