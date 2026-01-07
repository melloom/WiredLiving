import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Get credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wiredliving.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Simple authentication check
    if (email === adminEmail && password === adminPassword) {
      // Create a simple session token (in production, use a proper JWT)
      const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      // Set cookie (expires in 7 days)
      cookies().set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

