import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Get Supabase client with server-side session
 */
export function getSupabaseAuth() {
  const cookieStore = cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Get current authenticated user session
 */
export async function auth() {
  try {
    const supabase = getSupabaseAuth();
    
    // Use getUser() instead of getSession() for better security
    // getUser() validates the JWT token with the auth server
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseAuth();
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = getSupabaseAuth();
  return await supabase.auth.signOut();
}

// Export handlers for compatibility (if needed elsewhere)
export const handlers = {
  GET: async () => new Response('OK', { status: 200 }),
  POST: async () => new Response('OK', { status: 200 }),
};


