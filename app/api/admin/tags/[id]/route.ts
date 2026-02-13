import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logAdminAction } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Update a tag
 * PUT /api/admin/tags/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const tagId = resolvedParams.id;

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

    // Check if tag exists
    const { data: existingTag, error: fetchError } = await supabase!
      .from('tags')
      .select('id, name')
      .eq('id', tagId)
      .single();

    if (fetchError || !existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check if new name already exists
    if (tagName !== existingTag.name) {
      const { data: duplicateTag } = await supabase!
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();

      if (duplicateTag) {
        return NextResponse.json(
          { success: false, error: 'Tag name already exists' },
          { status: 400 }
        );
      }
    }

    // Update tag
    const { data: updatedTag, error: updateError } = await supabase!
      .from('tags')
      .update({ name: tagName })
      .eq('id', tagId)
      .select()
      .single();

    if (updateError || !updatedTag) {
      throw updateError || new Error('Failed to update tag');
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'other',
      targetType: 'tag',
      targetId: tagId,
      meta: { oldName: existingTag.name, newName: tagName },
    });

    return NextResponse.json({
      success: true,
      tag: updatedTag,
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tag',
      },
      { status: 500 }
    );
  }
}

/**
 * Delete a tag
 * DELETE /api/admin/tags/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const tagId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    // Get tag info for logging
    const { data: tag, error: fetchError } = await supabase!
      .from('tags')
      .select('id, name')
      .eq('id', tagId)
      .single();

    if (fetchError || !tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete tag (cascade will handle post_tags)
    const { error: deleteError } = await supabase!
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      throw deleteError;
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'other',
      targetType: 'tag',
      targetId: tagId,
      meta: { name: tag.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete tag',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'PUT, DELETE, OPTIONS',
    },
  });
}

