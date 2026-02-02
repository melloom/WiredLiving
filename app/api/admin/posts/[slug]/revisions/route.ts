import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPostRevisions } from '@/lib/supabase-db';
import { getPostBySlugAny } from '@/lib/supabase-db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const post = await getPostBySlugAny(resolvedParams.slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
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

    const revisions = await getPostRevisions(postData.id);

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

