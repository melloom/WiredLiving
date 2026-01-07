import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllPosts } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { AdminDashboard } from '@/components/admin-dashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your blog posts and content',
};

export default function AdminPage() {
  // Check authentication
  if (!isAuthenticated()) {
    redirect('/login');
  }

  const posts = getAllPosts();

  return <AdminDashboard posts={posts} />;
}

