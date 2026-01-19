import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/setup-user
 * Adds the current logged-in user to the users table with admin role
 */
export async function POST(request: Request) {
  // Check authentication
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const userEmail = session.user.email;

  try {
    // Create service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      // Update existing user to admin
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: 'admin', 
          is_active: true,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'User updated to admin',
        user: data
      });
    } else {
      // Create new admin user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: session.user.name || 'Admin User',
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Admin user created',
        user: data
      });
    }
  } catch (error) {
    console.error('Error setting up user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup user',
        details: error
      },
      { status: 500 }
    );
  }
}
