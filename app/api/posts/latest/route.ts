import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeSlug = searchParams.get('exclude');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Get all posts
    const allPosts = await getAllPosts();
    
    // Filter out excluded post and take latest
    let posts = allPosts;
    if (excludeSlug) {
      posts = posts.filter(post => post.slug !== excludeSlug);
    }

    // Take the latest posts (already sorted by date in getAllPosts)
    const latestPosts = posts.slice(0, limit).map(post => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      readingTime: post.readingTime,
      category: post.category,
    }));

    return NextResponse.json({ posts: latestPosts });
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest posts' },
      { status: 500 }
    );
  }
}
