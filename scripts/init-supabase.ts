/**
 * Supabase Initialization Script
 * 
 * This script will:
 * 1. Create all database tables
 * 2. Create the storage bucket for images
 * 
 * Run with: npx tsx scripts/init-supabase.ts
 * Or: npm run init-supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const SQL_SCHEMA = `
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  slug_override TEXT,
  slug_locked BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  visibility TEXT DEFAULT 'public',
  is_premium BOOLEAN DEFAULT false,
  requires_login BOOLEAN DEFAULT false,
  reading_time INTEGER,
  word_count INTEGER,
  excerpt TEXT,
  cover_image TEXT,
  featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image_override TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  gallery_images JSONB,
  category TEXT,
  series TEXT,
  series_order INTEGER,
  canonical_url TEXT,
  structured_data_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  ip TEXT,
  user_agent TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_email ON admin_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
`;

async function createTables() {
  console.log('📊 Creating database tables...');
  
  try {
    // Supabase doesn't support DDL via the JS client directly
    // We need to use the REST API or provide SQL to run manually
    // For now, we'll check if tables exist and provide instructions
    
    const { error: checkError } = await supabase
      .from('posts')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('⚠️  Tables do not exist yet.');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('   Dashboard → SQL Editor → New Query');
      console.log('\n' + '='.repeat(60));
      console.log(SQL_SCHEMA);
      console.log('='.repeat(60) + '\n');
      
      // Try to execute via RPC if a function exists, otherwise return
      console.log('💡 Attempting to create tables via SQL execution...');
      
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey!}`,
        },
        body: JSON.stringify({ sql: SQL_SCHEMA }),
      });
      
      if (!response.ok) {
        // RPC function might not exist, that's okay
        console.log('ℹ️  Could not execute SQL automatically. Please run it manually in the SQL Editor.');
        return false;
      }
      
      console.log('✅ Tables created successfully!');
      return true;
    } else if (checkError) {
      throw checkError;
    } else {
      console.log('✅ Database tables already exist!');
      return true;
    }
  } catch (error: any) {
    console.error('❌ Error checking/creating tables:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   Dashboard → SQL Editor → New Query');
    console.log('\n' + '='.repeat(60));
    console.log(SQL_SCHEMA);
    console.log('='.repeat(60) + '\n');
    return false;
  }
}

async function createStorageBucket() {
  console.log('🪣 Creating storage bucket...');
  
  const bucketName = 'blog-images';
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Storage bucket "${bucketName}" already exists!`);
      return true;
    }
    
    // Create bucket
    const { data, error } = await supabase
      .storage
      .createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880, // 5MB
      });
    
    if (error) {
      // If bucket creation fails, try without options
      const { error: simpleError } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
        });
      
      if (simpleError) {
        throw simpleError;
      }
    }
    
    console.log(`✅ Storage bucket "${bucketName}" created successfully!`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error creating storage bucket:`, error.message);
    console.log('\n💡 Please create the bucket manually:');
    console.log('   1. Go to Supabase Dashboard → Storage');
    console.log(`   2. Click "Create bucket"`);
    console.log(`   3. Name: "${bucketName}"`);
    console.log('   4. Set to "Public"');
    console.log('   5. Click "Create bucket"\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Initializing Supabase...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  const tablesOk = await createTables();
  console.log('');
  const bucketOk = await createStorageBucket();
  
  console.log('\n' + '='.repeat(60));
  if (tablesOk && bucketOk) {
    console.log('✅ Supabase initialization complete!');
    console.log('🎉 You can now use your blog admin dashboard.');
  } else {
    console.log('⚠️  Some steps need manual completion.');
    console.log('📖 See instructions above or check SUPABASE_SETUP.md');
  }
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);

