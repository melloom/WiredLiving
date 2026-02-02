import { NextResponse } from 'next/server';
import { initDatabase, getDatabaseSchemaSQL } from '@/lib/supabase-db';

/**
 * API route to initialize the database schema
 * Run this once after setting up Supabase
 * 
 * GET /api/init-db
 * 
 * Note: Supabase requires SQL to be run in the dashboard SQL editor.
 * This endpoint will check if tables exist and provide the SQL if needed.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('Init DB endpoint called');
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not set');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.',
        hint: 'Add NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY to your .env.local file'
      },
      { status: 400 }
    );
  }

  console.log('Supabase is configured, starting initialization...');

  try {
    console.log('Calling initDatabase()...');
    
    // Add timeout to prevent hanging
    const initPromise = initDatabase();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database initialization timed out after 30 seconds. Check your database connection.')), 30000)
    );
    
    await Promise.race([initPromise, timeoutPromise]);
    console.log('Database initialization completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables exist and are accessible',
      tables: ['posts', 'tags', 'post_tags', 'admin_logs']
    }, { status: 200 });
  } catch (error) {
    console.error('Error initializing database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // If tables don't exist, include the SQL
    const sql = errorMessage.includes('do not exist') ? getDatabaseSchemaSQL() : null;
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        sql: sql,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        hint: sql 
          ? 'Run the SQL above in your Supabase dashboard SQL editor (Dashboard → SQL Editor → New Query)'
          : 'Check your Supabase credentials and ensure the database is accessible.'
      },
      { status: 500 }
    );
  }
}

