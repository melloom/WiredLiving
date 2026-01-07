import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/vercel-db';

/**
 * API route to initialize the database schema
 * Run this once after setting up Vercel Postgres
 * 
 * GET /api/init-db
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Check if database is configured
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'POSTGRES_URL environment variable is not set. Please set up Vercel Postgres first.' 
      },
      { status: 400 }
    );
  }

  try {
    await initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

