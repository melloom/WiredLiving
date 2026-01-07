import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import { getDatabaseSchemaSQL } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SQL_SCHEMA = getDatabaseSchemaSQL();

/**
 * Initialize Supabase database tables and storage bucket
 * POST /api/admin/init-supabase
 */
export async function POST() {
  // Protect endpoint
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY',
      },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results = {
    tables: false,
    bucket: false,
    errors: [] as string[],
  };

  // 1. Create database tables
  try {
    console.log('Creating database tables...');
    
    // Check if tables exist first
    const { error: checkError } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      // Tables don't exist - we need to run SQL
      // Supabase JS client doesn't support DDL, so we'll use the REST API
      try {
        // Try using Supabase's SQL execution endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ query: SQL_SCHEMA }),
        });

        if (!response.ok) {
          // RPC function might not exist - that's expected
          // We'll provide SQL for manual execution
          throw new Error('SQL execution via RPC not available');
        }

        results.tables = true;
        console.log('✅ Tables created via RPC');
      } catch (rpcError) {
        // RPC not available - provide SQL for manual execution
        console.log('⚠️  Cannot execute SQL automatically. SQL provided for manual execution.');
        results.errors.push(
          'Tables need to be created manually. Run the SQL in Supabase SQL Editor.'
        );
      }
    } else if (checkError) {
      throw checkError;
    } else {
      results.tables = true;
      console.log('✅ Tables already exist');
    }
  } catch (error: any) {
    console.error('Error with tables:', error);
    results.errors.push(`Table creation error: ${error.message}`);
  }

  // 2. Create storage bucket
  try {
    console.log('Creating storage bucket...');
    const bucketName = 'blog-images';

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some((b) => b.name === bucketName);

    if (bucketExists) {
      results.bucket = true;
      console.log('✅ Bucket already exists');
    } else {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        // Try simpler options
        const { error: simpleError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });

        if (simpleError) {
          throw simpleError;
        }
      }

      results.bucket = true;
      console.log('✅ Bucket created');
    }
  } catch (error: any) {
    console.error('Error creating bucket:', error);
    results.errors.push(`Bucket creation error: ${error.message}`);
  }

  // Return results
  if (results.tables && results.bucket) {
    return NextResponse.json({
      success: true,
      message: 'Supabase initialized successfully!',
      tables: results.tables,
      bucket: results.bucket,
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'Some initialization steps need manual completion',
      tables: results.tables,
      bucket: results.bucket,
      errors: results.errors,
      sql: !results.tables ? SQL_SCHEMA : undefined,
      instructions: !results.tables
        ? 'Run the SQL above in Supabase Dashboard → SQL Editor → New Query'
        : !results.bucket
        ? 'Create bucket manually: Storage → Create bucket → Name: "blog-images" → Public'
        : undefined,
    });
  }
}

