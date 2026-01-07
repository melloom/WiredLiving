import { sql } from '@vercel/postgres';
import { BlogPost } from '@/types';
import readingTime from 'reading-time';

// Database row types
interface PostRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  date: string;
  published: boolean;
  reading_time: number | null;
  created_at: string;
  updated_at: string;
}

interface TagRow {
  id: string;
  name: string;
}

/**
 * Get all published posts from database
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const { rows } = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('name', t.name)) 
          FILTER (WHERE t.name IS NOT NULL),
          '[]'::json
        ) as tags
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.published = true
      GROUP BY p.id
      ORDER BY p.date DESC
    `;

    return rows.map((row: any) => transformPostRow(row));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { rows } = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('name', t.name)) 
          FILTER (WHERE t.name IS NOT NULL),
          '[]'::json
        ) as tags
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.slug = ${slug} AND p.published = true
      GROUP BY p.id
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return transformPostRow(rows[0] as any);
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tagName: string): Promise<BlogPost[]> {
  try {
    const { rows } = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('name', t.name)) 
          FILTER (WHERE t.name IS NOT NULL),
          '[]'::json
        ) as tags
      FROM posts p
      INNER JOIN post_tags pt ON p.id = pt.post_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE p.published = true AND t.name = ${tagName}
      GROUP BY p.id
      ORDER BY p.date DESC
    `;

    return rows.map((row: any) => transformPostRow(row));
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    return [];
  }
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT DISTINCT name
      FROM tags
      ORDER BY name
    `;

    return rows.map((row: any) => row.name);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Transform database row to BlogPost type
 */
function transformPostRow(row: any): BlogPost {
  // Handle tags - could be JSON array or already parsed
  let tags: string[] = [];
  if (row.tags) {
    if (typeof row.tags === 'string') {
      try {
        const parsed = JSON.parse(row.tags);
        tags = Array.isArray(parsed) ? parsed.map((t: { name: string }) => t.name) : [];
      } catch {
        tags = [];
      }
    } else if (Array.isArray(row.tags)) {
      tags = row.tags.map((t: any) => t.name).filter(Boolean);
    }
  }

  // Calculate reading time if not stored
  const readingTimeMinutes = row.reading_time
    ? row.reading_time
    : Math.ceil(readingTime(row.content).minutes);

  return {
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    date: row.date,
    author: row.author,
    tags,
    published: row.published,
    content: row.content,
    readingTime: readingTimeMinutes,
  };
}

/**
 * Create a new post (admin function)
 */
export async function createPost(post: Omit<BlogPost, 'slug'> & { slug?: string }): Promise<BlogPost | null> {
  try {
    const slug = post.slug || generateSlug(post.title);
    const readingTimeMinutes = Math.ceil(readingTime(post.content || '').minutes);

    // Insert post
    const { rows } = await sql`
      INSERT INTO posts (slug, title, description, content, author, date, published, reading_time)
      VALUES (${slug}, ${post.title}, ${post.description || ''}, ${post.content || ''}, ${post.author}, ${post.date}, ${post.published ?? false}, ${readingTimeMinutes})
      RETURNING *
    `;

    if (rows.length === 0) {
      return null;
    }

    const postId = rows[0].id;

    // Sync tags if provided
    if (post.tags && post.tags.length > 0) {
      await syncPostTags(postId, post.tags);
    }

    return getPostBySlug(slug);
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

/**
 * Sync tags for a post
 */
async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    // Try to get existing tag
    const { rows: existingTags } = await sql`
      SELECT id FROM tags WHERE name = ${tagName} LIMIT 1
    `;

    let tagId: string;

    if (existingTags.length > 0) {
      tagId = existingTags[0].id;
    } else {
      // Create new tag
      const { rows: newTags } = await sql`
        INSERT INTO tags (name) VALUES (${tagName}) RETURNING id
      `;
      tagId = newTags[0].id;
    }

    tagIds.push(tagId);
  }

  // Delete existing post_tags
  await sql`DELETE FROM post_tags WHERE post_id = ${postId}`;

  // Insert new post_tags
  if (tagIds.length > 0) {
    for (const tagId of tagIds) {
      await sql`
        INSERT INTO post_tags (post_id, tag_id) VALUES (${postId}, ${tagId})
        ON CONFLICT (post_id, tag_id) DO NOTHING
      `;
    }
  }
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
 * Initialize database schema (run once)
 */
export async function initDatabase(): Promise<void> {
  try {
    // Create posts table
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        published BOOLEAN DEFAULT false,
        reading_time INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tags table
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `;

    // Create post_tags junction table
    await sql`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

