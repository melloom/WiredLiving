import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Get the access token from cookies (Supabase format)
    const accessToken = cookieStore.get('sb-access-token')?.value || 
                       cookieStore.get(`sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`)?.value;
    
    if (!accessToken) {
      return NextResponse.json({ session: null, user: null });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return NextResponse.json({ 
        session: session,
        user: session.user 
      });
    }

    return NextResponse.json({ session: null, user: null });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ session: null, user: null });
  }
}
