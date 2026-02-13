import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { BlogPost, BlogPostFrontmatter } from '@/types';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => file.replace(/\.(mdx|md)$/, ''));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    // Try .md extension
    const mdPath = path.join(postsDirectory, `${realSlug}.md`);
    if (!fs.existsSync(mdPath)) {
      return null;
    }
    return getPostFromFile(mdPath, realSlug);
  }
  
  return getPostFromFile(fullPath, realSlug);
}

function getPostFromFile(filePath: string, slug: string): BlogPost {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontmatter = data as BlogPostFrontmatter;
  const stats = readingTime(content);

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    author: frontmatter.author,
    tags: frontmatter.tags || [],
    published: frontmatter.published ?? true,
    content,
    readingTime: Math.ceil(stats.minutes),
  };
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null && post.published === true)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return posts;
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) => (post.tags || []).includes(tag));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}


