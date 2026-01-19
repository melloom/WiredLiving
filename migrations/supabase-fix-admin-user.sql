-- Fix: Add current authenticated user as admin
-- This migration ensures the logged-in user can create posts
-- Run this in your Supabase SQL Editor

-- Step 1: Insert or update your user as admin
INSERT INTO users (email, name, role, is_active)
VALUES ('Melvin.a.p.cruz@gmail.com', 'Melvin Cruz', 'admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin', 
  is_active = true, 
  updated_at = NOW();

-- Step 2: Verify the user was added
SELECT email, role, is_active, created_at 
FROM users 
WHERE email = 'Melvin.a.p.cruz@gmail.com';

-- Alternative: If you don't want to edit SQL, use the API endpoint instead:
-- 1. Make sure you're logged in to your site
-- 2. Visit: https://wiredliving.blog/api/admin/make-me-admin
-- 3. Or run: curl -X POST https://wiredliving.blog/api/admin/make-me-admin --cookie "your-session-cookie"
