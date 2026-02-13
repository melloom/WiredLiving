import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/supabase-db';

export async function POST(request: NextRequest) {
  try {
    const { slugs } = await request.json();

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json([]);
    }

    // Get all posts and filter by slugs
    const allPosts = await getAllPosts();
    const filteredPosts = allPosts.filter(post => slugs.includes(post.slug));

    // Return only necessary fields
    const simplifiedPosts = filteredPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      category: post.category,
      coverImage: post.coverImage,
      readingTime: post.readingTime,
    }));

    return NextResponse.json(simplifiedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
