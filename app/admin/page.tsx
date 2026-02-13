import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getAllPostsAdmin } from '@/lib/supabase-db';
import { AdminDashboard } from '@/components/admin-dashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your blog posts and content',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminPage() {
  // Check authentication with Supabase
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Redirect to login with callback URL
    redirect('/login?callbackUrl=/admin');
  }

  // Get all posts from Supabase (including drafts)
  const posts = await getAllPostsAdmin();

  return <AdminDashboard posts={posts} />;
}