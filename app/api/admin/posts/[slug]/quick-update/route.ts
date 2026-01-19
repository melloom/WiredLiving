import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logAdminAction } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Quick update for post properties (featured, published, status, etc.)
 * PATCH /api/admin/posts/[slug]/quick-update
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  // Protect endpoint
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const body = await request.json();
    const { field, value, updates } = body;

    // Handle multiple updates at once
    if (updates && Array.isArray(updates)) {
      if (!isSupabaseConfigured()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Supabase not configured',
          },
          { status: 500 }
        );
      }

      const { data: post, error: fetchError } = await supabase!
        .from('posts')
        .select('id, title')
        .eq('slug', slug)
        .single();

      if (fetchError || !post) {
        return NextResponse.json(
          {
            success: false,
            error: 'Post not found',
          },
          { status: 404 }
        );
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      
      // Process each update
      for (const update of updates) {
        const { field: updateField, value: updateValue } = update;
        switch (updateField) {
          case 'series':
            updateData.series = updateValue || null;
            break;
          case 'seriesOrder':
            updateData.series_order = updateValue !== null && updateValue !== undefined ? updateValue : null;
            break;
        }
      }

      const { data: updatedPost, error: updateError } = await supabase!
        .from('posts')
        .update(updateData)
        .eq('slug', slug)
        .select()
        .single();

      if (updateError || !updatedPost) {
        console.error('Error updating post:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: updateError?.message || 'Failed to update post',
          },
          { status: 500 }
        );
      }

      await logAdminAction({
        userEmail: session.user?.email || 'unknown',
        action: 'update_post',
        targetType: 'post',
        targetId: updatedPost.id,
        meta: { slug, updates, title: post.title },
      });

      return NextResponse.json({
        success: true,
        post: updatedPost,
      });
    }

    if (!field) {
      return NextResponse.json(
        { success: false, error: 'Field is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase not configured',
        },
        { status: 500 }
      );
    }

    // Get post first to get current values
    const { data: post, error: fetchError } = await supabase!
      .from('posts')
      .select('id, title, featured, published, status, is_premium, requires_login')
      .eq('slug', slug)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found',
        },
        { status: 404 }
      );
    }

    // Prepare update data based on field
    const updateData: any = {};

    switch (field) {
      case 'featured':
        updateData.featured = value !== undefined ? value : !post.featured;
        break;
      case 'published':
        updateData.published = value !== undefined ? value : !post.published;
        updateData.status = (value !== undefined ? value : !post.published) ? 'published' : 'draft';
        break;
      case 'status':
        updateData.status = value;
        updateData.published = value === 'published';
        break;
      case 'visibility':
        updateData.visibility = value;
        break;
      case 'isPremium':
        updateData.is_premium = value !== undefined ? value : !post.is_premium;
        break;
      case 'requiresLogin':
        updateData.requires_login = value !== undefined ? value : !post.requires_login;
        break;
      case 'series':
        updateData.series = value || null;
        break;
      case 'seriesOrder':
        updateData.series_order = value !== null && value !== undefined ? value : null;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid field' },
          { status: 400 }
        );
    }

    updateData.updated_at = new Date().toISOString();

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase!
      .from('posts')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (updateError || !updatedPost) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || 'Failed to update post',
        },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'update_post',
      targetType: 'post',
      targetId: updatedPost.id,
      meta: { slug, field, value, title: post.title },
    });

    return NextResponse.json({
      success: true,
      post: {
        slug: updatedPost.slug,
        title: updatedPost.title,
        [field]: updateData[field] || updateData[Object.keys(updateData)[0]],
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'PATCH, OPTIONS',
    },
  });
}

