import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = cookies().get('admin_session');
  return NextResponse.json({ authenticated: !!session });
}

