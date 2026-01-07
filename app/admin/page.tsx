import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllPostsAdmin } from '@/lib/supabase-db';
import { AdminDashboard } from '@/components/admin-dashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your blog posts and content',
};

export default async function AdminPage() {
  // Check authentication with NextAuth
  const session = await auth();
  
  if (!session) {
    // Redirect to login with callback URL
    redirect('/login?callbackUrl=/admin');
  }

  // Get all posts from Supabase (including drafts)
  const posts = await getAllPostsAdmin();

  return <AdminDashboard posts={posts} />;
}

