import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, togglePostLike, getPostLikesCount, hasUserLikedPost } from '@/lib/supabase-db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userIdentifier, reactionType = 'like' } = body;

    if (!userIdentifier) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    // Get post ID from database
    const { supabase } = await import('@/lib/supabase');
    const { data: postData, error: postError } = await supabase!
      .from('posts')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .single();

    if (postError || !postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isLiked = await togglePostLike(postData.id, userIdentifier, reactionType);
    const likesCount = await getPostLikesCount(postData.id, reactionType);

    return NextResponse.json({ 
      isLiked, 
      likesCount,
      success: true 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userIdentifier = searchParams.get('userIdentifier');
    const reactionType = searchParams.get('reactionType') || 'like';

    // Get post ID from database
    const { supabase } = await import('@/lib/supabase');
    const { data: postData, error: postError } = await supabase!
      .from('posts')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .single();

    if (postError || !postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const likesCount = await getPostLikesCount(postData.id, reactionType);
    const hasLiked = userIdentifier ? await hasUserLikedPost(postData.id, userIdentifier, reactionType) : false;

    return NextResponse.json({ 
      likesCount,
      hasLiked,
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

