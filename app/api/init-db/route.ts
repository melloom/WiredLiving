import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/vercel-db';

/**
 * API route to initialize the database schema
 * Run this once after setting up Vercel Postgres
 * 
 * GET /api/init-db
 */
export async function GET() {
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

