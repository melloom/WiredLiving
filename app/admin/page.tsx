import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllPosts } from '@/lib/mdx';
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

  const posts = getAllPosts();

  return <AdminDashboard posts={posts} />;
}

