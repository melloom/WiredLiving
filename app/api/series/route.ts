import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

// GET /api/series - Get all series metadata
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('series_metadata')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching series metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series metadata' },
      { status: 500 }
    );
  }
}

// POST /api/series - Create or update series metadata
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description, cover_image, color_scheme, tags, is_featured, display_order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if series exists
    const { data: existing } = await supabase
      .from('series_metadata')
      .select('id')
      .eq('name', name)
      .single();

    let result;
    if (existing) {
      // Update existing series
      const { data, error } = await supabase
        .from('series_metadata')
        .update({
          slug,
          description,
          cover_image,
          color_scheme,
          tags,
          is_featured,
          display_order,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new series
      const { data, error } = await supabase
        .from('series_metadata')
        .insert({
          name,
          slug,
          description,
          cover_image,
          color_scheme,
          tags,
          is_featured,
          display_order,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving series metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save series metadata' },
      { status: 500 }
    );
  }
}

// DELETE /api/series - Delete series metadata
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Series name is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('series_metadata')
      .delete()
      .eq('name', name);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting series metadata:', error);
    return NextResponse.json(
      { error: 'Failed to delete series metadata' },
      { status: 500 }
    );
  }
}
