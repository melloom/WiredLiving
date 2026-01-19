import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const dynamic = 'force-dynamic';

/**
 * Migrate analytics data from old slug to new slug
 * This updates all page_views and post_analytics records
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Analytics not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { oldSlug, newSlug } = body;

    if (!oldSlug || !newSlug) {
      return NextResponse.json(
        { success: false, error: 'Both oldSlug and newSlug are required' },
        { status: 400 }
      );
    }

    // Update page_views table
    const { error: pageViewsError } = await supabase
      .from('page_views')
      .update({ post_slug: newSlug })
      .eq('post_slug', oldSlug);

    if (pageViewsError) {
      console.error('Error updating page_views:', pageViewsError);
      return NextResponse.json(
        { success: false, error: 'Failed to update page views' },
        { status: 500 }
      );
    }

    // Count updated views
    const { count: pageViewsCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_slug', newSlug);

    // Check if new slug already has analytics
    const { data: existingNewAnalytics } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_slug', newSlug)
      .single();

    // Get old slug analytics
    const { data: oldAnalytics } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_slug', oldSlug)
      .single();

    let analyticsResult;

    if (existingNewAnalytics && oldAnalytics) {
      // Merge the analytics data
      const { error: mergeError } = await supabase
        .from('post_analytics')
        .update({
          total_views: existingNewAnalytics.total_views + oldAnalytics.total_views,
          unique_visitors: existingNewAnalytics.unique_visitors + oldAnalytics.unique_visitors,
          last_viewed: new Date(
            Math.max(
              new Date(existingNewAnalytics.last_viewed || 0).getTime(),
              new Date(oldAnalytics.last_viewed || 0).getTime()
            )
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('post_slug', newSlug);

      if (mergeError) {
        console.error('Error merging analytics:', mergeError);
      } else {
        // Delete old analytics
        await supabase
          .from('post_analytics')
          .delete()
          .eq('post_slug', oldSlug);
        
        analyticsResult = 'merged';
      }
    } else if (oldAnalytics) {
      // Just update the slug in post_analytics
      const { error: updateError } = await supabase
        .from('post_analytics')
        .update({ post_slug: newSlug, updated_at: new Date().toISOString() })
        .eq('post_slug', oldSlug);

      if (updateError) {
        console.error('Error updating post_analytics:', updateError);
      } else {
        analyticsResult = 'updated';
      }
    } else {
      analyticsResult = 'no old analytics found';
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated analytics from '${oldSlug}' to '${newSlug}'`,
      details: {
        pageViewsUpdated: pageViewsCount || 0,
        analyticsAction: analyticsResult,
      },
    });
  } catch (error) {
    console.error('Error migrating analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete analytics data for a specific slug
 * Useful for cleaning up old/test data
 */
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Analytics not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Delete from page_views
    const { error: pageViewsError } = await supabase
      .from('page_views')
      .delete()
      .eq('post_slug', slug);

    // Count would have been deleted
    const pageViewsCount = 0;

    if (pageViewsError) {
      console.error('Error deleting page_views:', pageViewsError);
    }

    // Delete from post_analytics
    const { error: analyticsError } = await supabase
      .from('post_analytics')
      .delete()
      .eq('post_slug', slug);

    if (analyticsError) {
      console.error('Error deleting post_analytics:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted analytics for slug '${slug}'`,
      details: {
        pageViewsDeleted: pageViewsCount || 0,
      },
    });
  } catch (error) {
    console.error('Error deleting analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
