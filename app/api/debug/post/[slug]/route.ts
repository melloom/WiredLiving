import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const params = await Promise.resolve(context.params);
  const supabase = createClient();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('slug, title, sidebar_widgets')
      .eq('slug', params.slug)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
      raw_sidebar_widgets: post.sidebar_widgets,
      sidebar_widgets_type: typeof post.sidebar_widgets,
      sidebar_widgets_parsed: post.sidebar_widgets,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
