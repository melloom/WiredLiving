import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, saveReadingHistory } from '@/lib/supabase-db';

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
    const { userIdentifier, progressPercentage, timeSpentSeconds = 0 } = body;

    if (!userIdentifier || progressPercentage === undefined) {
      return NextResponse.json({ error: 'User identifier and progress required' }, { status: 400 });
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

    const success = await saveReadingHistory(
      postData.id,
      userIdentifier,
      progressPercentage,
      timeSpentSeconds
    );

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error saving reading history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

