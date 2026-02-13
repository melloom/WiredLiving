import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logAdminAction } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get all tags with post counts
 * GET /api/admin/tags
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    // Get all tags with post counts
    const { data: tags, error: tagsError } = await supabase!
      .from('tags')
      .select('id, name, created_at')
      .order('name');

    if (tagsError) {
      throw tagsError;
    }

    // Get post counts for each tag
    const tagsWithCounts = await Promise.all(
      (tags || []).map(async (tag) => {
        const { count, error: countError } = await supabase!
          .from('post_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        const postCount = countError ? 0 : (count || 0);

        // Get published post count
        const { data: postTags } = await supabase!
          .from('post_tags')
          .select('post_id')
          .eq('tag_id', tag.id);

        const postIds = postTags?.map(pt => pt.post_id) || [];
        let publishedCount = 0;
        if (postIds.length > 0) {
          const { count: pubCount } = await supabase!
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .in('id', postIds)
            .eq('published', true);
          publishedCount = pubCount || 0;
        }

        return {
          id: tag.id,
          name: tag.name,
          postCount,
          publishedCount,
          draftCount: postCount - publishedCount,
          created_at: tag.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tags: tagsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
      },
      { status: 500 }
    );
  }
}

/**
 * Create a new tag
 * POST /api/admin/tags
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tagName = name.trim().toLowerCase();

    // Check if tag already exists
    const { data: existingTag } = await supabase!
      .from('tags')
      .select('id, name')
      .eq('name', tagName)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag already exists' },
        { status: 400 }
      );
    }

    // Create tag
    const { data: newTag, error: createError } = await supabase!
      .from('tags')
      .insert({ name: tagName })
      .select()
      .single();

    if (createError || !newTag) {
      throw createError || new Error('Failed to create tag');
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'other',
      targetType: 'tag',
      targetId: newTag.id,
      meta: { name: tagName },
    });

    return NextResponse.json({
      success: true,
      tag: {
        id: newTag.id,
        name: newTag.name,
        postCount: 0,
        publishedCount: 0,
        draftCount: 0,
      },
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}

