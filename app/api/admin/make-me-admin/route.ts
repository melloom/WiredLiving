import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/admin/make-me-admin
 * Adds the currently logged-in user to the users table as an admin
 */
export async function POST() {
  try {
    // Check authentication with NextAuth
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not logged in' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const userName = session.user.name || 'Admin User';

    // Create Supabase admin client
    const supabase = createClient();

    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email, role, is_active')
      .eq('email', userEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking user:', checkError);
      return NextResponse.json(
        { success: false, error: `Database error: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      // User exists, update to admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin', 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { success: false, error: `Failed to update user: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${userEmail} to admin role`,
        user: { email: userEmail, role: 'admin', is_active: true }
      });
    } else {
      // User doesn't exist, insert new admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: userName,
          role: 'admin',
          is_active: true,
        });

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return NextResponse.json(
          { success: false, error: `Failed to create user: ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Created admin user for ${userEmail}`,
        user: { email: userEmail, role: 'admin', is_active: true }
      });
    }
  } catch (error) {
    console.error('Error in make-me-admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
