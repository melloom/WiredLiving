import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Legacy NextAuth route - now redirects to Supabase Auth
export async function GET() {
  return NextResponse.json({ 
    message: 'This app now uses Supabase Auth. Please use /login to authenticate.' 
  }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'This app now uses Supabase Auth. Please use /login to authenticate.' 
  }, { status: 200 });
}


