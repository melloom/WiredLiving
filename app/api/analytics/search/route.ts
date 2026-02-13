import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false }, { status: 200 }); // Fail silently
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Insert search query (create table if needed)
    const { error } = await supabase
      .from('search_queries')
      .insert({
        query: query.toLowerCase().trim(),
        user_agent: userAgent,
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      });

    // Fail silently if table doesn't exist or there's an error
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
      console.error('Search analytics error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Fail silently
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

