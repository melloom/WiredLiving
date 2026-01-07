'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import readingTime from 'reading-time';
import { MarkdownToolbar } from '@/components/markdown-toolbar';

interface AdminDashboardProps {
  posts: BlogPost[];
}

type TabType = 'overview' | 'posts' | 'analytics' | 'tags' | 'create';

export function AdminDashboard({ posts }: AdminDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.published).length,
    draftPosts: posts.filter(p => !p.published).length,
    totalTags: new Set(posts.flatMap(p => p.tags)).size,
    totalWords: posts.reduce((sum, p) => sum + (p.content?.split(' ').length || 0), 0),
    avgReadingTime: posts.length > 0 
      ? Math.round(posts.reduce((sum, p) => sum + (p.readingTime || 0), 0) / posts.length)
      : 0,
  };

  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'published'
          ? post.published
          : !post.published;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) =>
      sortBy === 'newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  const recentPosts = [...posts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'posts' as TabType, label: 'Posts', icon: '📝' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: '📈' },
    { id: 'tags' as TabType, label: 'Tags', icon: '🏷️' },
    { id: 'create' as TabType, label: 'Create', icon: '➕' },
  ];

  // Quick update function
  const handleQuickUpdate = async (postSlug: string, field: string, value?: any) => {
    setUpdatingPost(postSlug);
    try {
      const response = await fetch(`/api/admin/posts/${postSlug}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(`Failed to update: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setUpdatingPost(null);
    }
  };

  // Delete post function
  const handleDeletePost = async (postSlug: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingPost(postSlug);
    try {
      const response = await fetch(`/api/admin/posts/${postSlug}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeletingPost(null);
    }
  };

  // Fetch analytics data when analytics tab is opened
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData && !analyticsLoading) {
      setAnalyticsLoading(true);
      fetch('/api/admin/analytics')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAnalyticsData(data.data);
          }
        })
        .catch(err => {
          console.error('Error fetching analytics:', err);
        })
        .finally(() => {
          setAnalyticsLoading(false);
        });
    }
  }, [activeTab, analyticsData, analyticsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Manage your blog content
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                target="_blank"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">📝</div>
                  <div className="text-3xl font-bold">{stats.totalPosts}</div>
                </div>
                <div className="text-blue-100">Total Posts</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">✅</div>
                  <div className="text-3xl font-bold">{stats.publishedPosts}</div>
                </div>
                <div className="text-green-100">Published</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">📋</div>
                  <div className="text-3xl font-bold">{stats.draftPosts}</div>
                </div>
                <div className="text-yellow-100">Drafts</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">🏷️</div>
                  <div className="text-3xl font-bold">{stats.totalTags}</div>
                </div>
                <div className="text-purple-100">Tags</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-left"
                  >
                    ➕ Create New Post
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/init-supabase', {
                          method: 'POST',
                        });
                        const data = await response.json();
                        if (data.success) {
                          alert('✅ Supabase initialized successfully!\n\n✅ Tables: ' + (data.tables ? 'Created' : 'Already exist') + '\n✅ Bucket: ' + (data.bucket ? 'Created' : 'Already exists'));
                        } else {
                          let message = '⚠️ Initialization incomplete:\n\n';
                          if (!data.tables) {
                            message += '❌ Tables: Not created\n';
                            if (data.sql) {
                              message += '\n📝 SQL to run:\n' + data.sql.substring(0, 200) + '...\n\n';
                              message += 'Run the full SQL in Supabase SQL Editor';
                              console.log('Full SQL to run:', data.sql);
                            }
                          } else {
                            message += '✅ Tables: OK\n';
                          }
                          if (!data.bucket) {
                            message += '❌ Bucket: Not created\n';
                            if (data.instructions) {
                              message += '\n' + data.instructions;
                            }
                          } else {
                            message += '✅ Bucket: OK\n';
                          }
                          if (data.errors && data.errors.length > 0) {
                            message += '\n\nErrors:\n' + data.errors.join('\n');
                          }
                          alert(message);
                        }
                      } catch (err) {
                        alert('❌ Error initializing Supabase. Check console for details.');
                        console.error(err);
                      }
                    }}
                    className="w-full px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all font-medium text-left"
                  >
                    🚀 Initialize Supabase (Tables + Storage)
                  </button>
                  <Link
                    href="/tags"
                    className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium text-left"
                  >
                    🏷️ Manage Tags
                  </Link>
                  <Link
                    href="/blog"
                    target="_blank"
                    className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium text-left"
                  >
                    👁️ View Blog
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Recent Posts</h3>
                <div className="space-y-3">
                  {recentPosts.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No posts yet</p>
                  ) : (
                    recentPosts.map((post) => (
                      <Link
                        key={post.slug}
                        href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                        target="_blank"
                        className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                          {post.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(post.date)}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium whitespace-nowrap"
                  >
                    ➕ New Post
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'published', label: 'Published' },
                    { id: 'draft', label: 'Drafts' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStatusFilter(opt.id as any)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        statusFilter === opt.id
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
              {filteredPosts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery ? 'No posts found matching your search' : 'No posts yet'}
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Create Your First Post
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.slug}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              {post.title}
                            </h3>
                            {post.featured && (
                              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full flex items-center gap-1">
                                ⭐ Featured
                              </span>
                            )}
                            {post.published ? (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                                Published
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">
                                Draft
                              </span>
                            )}
                            {post.isPremium && (
                              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                                Premium
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 flex-wrap">
                            <span>{formatDate(post.date)}</span>
                            <span>by {post.author}</span>
                            {post.readingTime && <span>{post.readingTime} min read</span>}
                            {post.tags.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
                            {/* Featured Toggle */}
                            <button
                              onClick={() => handleQuickUpdate(post.slug, 'featured')}
                              disabled={updatingPost === post.slug}
                              className={`p-2 rounded-lg transition-colors ${
                                post.featured
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                              title={post.featured ? 'Remove from featured' : 'Mark as featured'}
                            >
                              ⭐
                            </button>
                            
                            {/* Publish/Unpublish Toggle */}
                            <button
                              onClick={() => handleQuickUpdate(post.slug, 'published', !post.published)}
                              disabled={updatingPost === post.slug}
                              className={`p-2 rounded-lg transition-colors ${
                                post.published
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                              title={post.published ? 'Unpublish' : 'Publish'}
                            >
                              {post.published ? '👁️' : '👁️‍🗨️'}
                            </button>
                          </div>

                          {/* Main Actions */}
                          <Link
                            href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                            target="_blank"
                            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                          >
                            {post.published ? 'View' : 'Preview'}
                          </Link>
                          <button
                            onClick={() => setEditingPost(post)}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.slug, post.title)}
                            disabled={deletingPost === post.slug}
                            className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium disabled:opacity-50"
                            title="Delete post"
                          >
                            {deletingPost === post.slug ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (() => {
          // Calculate comprehensive analytics
          const publishedPosts = posts.filter(p => p.published);
          const draftPosts = posts.filter(p => !p.published);
          const scheduledPosts = posts.filter(p => p.status === 'scheduled');
          const premiumPosts = posts.filter(p => p.isPremium);
          const featuredPosts = posts.filter(p => p.featured);
          
          // Calculate total words and reading time
          const totalWords = posts.reduce((sum, post) => {
            const words = (post.content || '').split(/\s+/).filter(Boolean).length;
            return sum + words;
          }, 0);
          
          const totalReadingTime = posts.reduce((sum, post) => {
            const stats = readingTime(post.content || '');
            return sum + stats.minutes;
          }, 0);
          
          const avgReadingTime = publishedPosts.length > 0 
            ? Math.round((totalReadingTime / publishedPosts.length) * 10) / 10 
            : 0;
          
          // Category stats
          const categoryStats = posts.reduce((acc, post) => {
            const cat = post.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          // Series stats
          const seriesStats = posts.reduce((acc, post) => {
            if (post.series) {
              acc[post.series] = (acc[post.series] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
          
          // Author stats
          const authorStats = posts.reduce((acc, post) => {
            acc[post.author] = (acc[post.author] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          // Posts by month (last 12 months)
          const postsByMonth: Record<string, number> = {};
          const now = new Date();
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            postsByMonth[key] = 0;
          }
          
          publishedPosts.forEach(post => {
            const postDate = new Date(post.date);
            const key = postDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (postsByMonth[key] !== undefined) {
              postsByMonth[key]++;
            }
          });
          
          // Reading time distribution
          const readingTimeRanges = {
            '0-5 min': 0,
            '5-10 min': 0,
            '10-15 min': 0,
            '15-20 min': 0,
            '20+ min': 0,
          };
          
          publishedPosts.forEach(post => {
            const stats = readingTime(post.content || '');
            const mins = Math.ceil(stats.minutes);
            if (mins <= 5) readingTimeRanges['0-5 min']++;
            else if (mins <= 10) readingTimeRanges['5-10 min']++;
            else if (mins <= 15) readingTimeRanges['10-15 min']++;
            else if (mins <= 20) readingTimeRanges['15-20 min']++;
            else readingTimeRanges['20+ min']++;
          });
          
          // Top performing posts (by word count as proxy for engagement)
          const topPosts = [...publishedPosts]
            .sort((a, b) => {
              const aWords = (a.content || '').split(/\s+/).filter(Boolean).length;
              const bWords = (b.content || '').split(/\s+/).filter(Boolean).length;
              return bWords - aWords;
            })
            .slice(0, 10);
          
          // Tags with counts
          const tagStats = Array.from(new Set(posts.flatMap(p => p.tags)))
            .map(tag => ({
              tag,
              count: posts.filter(p => p.tags.includes(tag)).length,
              publishedCount: publishedPosts.filter(p => p.tags.includes(tag)).length,
            }))
            .sort((a, b) => b.count - a.count);
          
          // SEO coverage
          const seoCoverage = {
            hasSeoTitle: publishedPosts.filter(p => p.seoTitle).length,
            hasSeoDescription: publishedPosts.filter(p => p.seoDescription).length,
            hasOgImage: publishedPosts.filter(p => p.ogImageOverride || p.coverImage).length,
            hasCanonical: publishedPosts.filter(p => p.canonicalUrl).length,
          };
          
          // Real analytics data
          const realAnalytics = analyticsData;
          const totalPageViews = realAnalytics?.totalViews || 0;
          const totalUniqueVisitors = realAnalytics?.uniqueVisitors || 0;
          const topPostsByViews = realAnalytics?.topPosts || [];
          const dailyStats = realAnalytics?.dailyAnalytics || [];
          const deviceStats = realAnalytics?.deviceStats || {};
          const referrers = realAnalytics?.referrers || [];
          
          return (
            <div className="space-y-6">
              {analyticsLoading && (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  Loading analytics data...
                </div>
              )}
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">👁️</div>
                    <div className="text-3xl font-bold">{totalPageViews.toLocaleString()}</div>
                  </div>
                  <div className="text-blue-100 text-sm">Total Page Views</div>
                  <div className="text-xs text-blue-200 mt-1">
                    {totalUniqueVisitors.toLocaleString()} unique visitors
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">👥</div>
                    <div className="text-3xl font-bold">{totalUniqueVisitors.toLocaleString()}</div>
                  </div>
                  <div className="text-purple-100 text-sm">Unique Visitors</div>
                  <div className="text-xs text-purple-200 mt-1">
                    {totalPageViews > 0 ? (totalPageViews / totalUniqueVisitors).toFixed(1) : 0} views per visitor
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">📝</div>
                    <div className="text-3xl font-bold">{totalWords.toLocaleString()}</div>
                  </div>
                  <div className="text-green-100 text-sm">Total Words</div>
                  <div className="text-xs text-green-200 mt-1">
                    Avg: {Math.round(totalWords / (publishedPosts.length || 1)).toLocaleString()} per post
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">⏱️</div>
                    <div className="text-3xl font-bold">{avgReadingTime}</div>
                  </div>
                  <div className="text-amber-100 text-sm">Avg Reading Time</div>
                  <div className="text-xs text-amber-200 mt-1">
                    {Math.round(totalReadingTime)} min total
                  </div>
                </div>
              </div>
              
              {/* Real Analytics Section */}
              {realAnalytics && (
                <>
                  {/* Daily Views Chart */}
                  {dailyStats.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span>📈</span> Daily Page Views (Last 30 Days)
                        </h3>
                        <div className="space-y-3">
                          {dailyStats.slice(0, 30).reverse().map((day: any) => {
                            const maxViews = Math.max(...dailyStats.map((d: any) => d.total_views), 1);
                            return (
                              <div key={day.date}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {day.total_views} views • {day.unique_visitors} visitors
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                                    style={{ width: `${(day.total_views / maxViews) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                  )}
                  
                  {/* Top Posts by Views */}
                  {topPostsByViews.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🔥</span> Top Posts by Views
                      </h3>
                      <div className="space-y-3">
                        {topPostsByViews.map((post: any, idx: number) => (
                          <div
                            key={post.post_slug}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {posts.find(p => p.slug === post.post_slug)?.title || post.post_slug}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {post.total_views.toLocaleString()} views • {post.unique_visitors.toLocaleString()} unique visitors
                                </div>
                              </div>
                            </div>
                            <Link
                              href={`/blog/${post.post_slug}`}
                              target="_blank"
                              className="ml-4 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex-shrink-0"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Device Stats */}
                  {Object.keys(deviceStats).length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span>📱</span> Device Types
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(deviceStats).map(([device, count]: [string, any]) => {
                            const total = Object.values(deviceStats).reduce((sum: number, val: any) => sum + val, 0);
                            return (
                              <div key={device}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{device}</span>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {count.toLocaleString()} ({Math.round((count / total) * 100)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(count / total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Top Referrers */}
                      {referrers.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span>🔗</span> Top Referrers
                          </h3>
                          <div className="space-y-2">
                            {referrers.map((ref: any) => (
                              <div key={ref.referrer} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                  {ref.referrer === 'direct' ? 'Direct' : new URL(ref.referrer).hostname}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">
                                  {ref.count.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Posts Over Time */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>📈</span> Posts Published Over Time
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(postsByMonth).map(([month, count]) => {
                      const maxCount = Math.max(...Object.values(postsByMonth), 1);
                      return (
                        <div key={month}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{month}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reading Time Distribution */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>⏱️</span> Reading Time Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(readingTimeRanges).map(([range, count]) => {
                      const maxCount = Math.max(...Object.values(readingTimeRanges), 1);
                      return (
                        <div key={range}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{range}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status & Visibility Breakdown */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>📊</span> Post Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.publishedPosts}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${stats.totalPosts > 0 ? (stats.publishedPosts / stats.totalPosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Drafts</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.draftPosts}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all"
                          style={{ width: `${stats.totalPosts > 0 ? (stats.draftPosts / stats.totalPosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    {scheduledPosts.length > 0 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{scheduledPosts.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${stats.totalPosts > 0 ? (scheduledPosts.length / stats.totalPosts) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>👁️</span> Visibility
                  </h3>
                  <div className="space-y-3">
                    {['public', 'unlisted', 'private'].map(vis => {
                      const count = publishedPosts.filter(p => (p.visibility || 'public') === vis).length;
                      return (
                        <div key={vis}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{vis}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                vis === 'public' ? 'bg-green-500' : vis === 'unlisted' ? 'bg-blue-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${stats.publishedPosts > 0 ? (count / stats.publishedPosts) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>🔒</span> Access Control
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Premium Posts</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{premiumPosts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Requires Login</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {posts.filter(p => p.requiresLogin).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Public Access</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {publishedPosts.filter(p => !p.isPremium && !p.requiresLogin).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Series Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                {Object.keys(categoryStats).length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>📁</span> Categories
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(categoryStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => {
                          const maxCount = Math.max(...Object.values(categoryStats));
                          return (
                            <div key={cat}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{cat}</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                  style={{ width: `${(count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {Object.keys(seriesStats).length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>📚</span> Series
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(seriesStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([series, count]) => {
                          const maxCount = Math.max(...Object.values(seriesStats));
                          return (
                            <div key={series}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{series}</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                                  style={{ width: `${(count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Tags */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>🏷️</span> Top Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {tagStats.slice(0, 20).map(({ tag, count, publishedCount }) => (
                    <div
                      key={tag}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{tag}</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        ({count} total, {publishedCount} published)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Author Stats */}
              {Object.keys(authorStats).length > 1 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>✍️</span> Author Contributions
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(authorStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([author, count]) => {
                        const maxCount = Math.max(...Object.values(authorStats));
                        return (
                          <div key={author}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{author}</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count} posts</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SEO Coverage */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>🔍</span> SEO Coverage
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {seoCoverage.hasSeoTitle}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">SEO Titles</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {stats.publishedPosts > 0 
                        ? Math.round((seoCoverage.hasSeoTitle / stats.publishedPosts) * 100) 
                        : 0}% coverage
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {seoCoverage.hasSeoDescription}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">SEO Descriptions</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {stats.publishedPosts > 0 
                        ? Math.round((seoCoverage.hasSeoDescription / stats.publishedPosts) * 100) 
                        : 0}% coverage
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {seoCoverage.hasOgImage}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">OG Images</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {stats.publishedPosts > 0 
                        ? Math.round((seoCoverage.hasOgImage / stats.publishedPosts) * 100) 
                        : 0}% coverage
                    </div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {seoCoverage.hasCanonical}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Canonical URLs</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {stats.publishedPosts > 0 
                        ? Math.round((seoCoverage.hasCanonical / stats.publishedPosts) * 100) 
                        : 0}% coverage
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Posts */}
              {topPosts.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>🔥</span> Top Performing Posts (by content length)
                  </h3>
                  <div className="space-y-3">
                    {topPosts.map((post, idx) => {
                      const wordCount = (post.content || '').split(/\s+/).filter(Boolean).length;
                      const stats = readingTime(post.content || '');
                      return (
                        <div
                          key={post.slug}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {post.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {wordCount.toLocaleString()} words • {Math.ceil(stats.minutes)} min read
                                {post.category && ` • ${post.category}`}
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="ml-4 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <TagsManagementTab posts={posts} />
        )}

        {/* Create Post Tab */}
        {activeTab === 'create' && (
          <CreatePostForm onSuccess={() => {
            setActiveTab('posts');
            router.refresh();
          }} />
        )}

        {/* Edit Post Modal */}
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Post: {editingPost.title}
                </h2>
                <button
                  onClick={() => setEditingPost(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <EditPostForm 
                  post={editingPost} 
                  onSuccess={() => {
                    setEditingPost(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingPost(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tags Management Tab Component
function TagsManagementTab({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [tags, setTags] = useState<Array<{
    id: string;
    name: string;
    postCount: number;
    publishedCount: number;
    draftCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  // Fetch tags
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tags');
      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      const data = await response.json();
      if (data.success) {
        setNewTagName('');
        fetchTags();
        router.refresh();
      } else {
        alert(`Failed to create tag: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    if (!editTagName.trim()) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTagName }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingTag(null);
        setEditTagName('');
        fetchTags();
        router.refresh();
      } else {
        alert(`Failed to update tag: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"? This will remove it from all posts.`)) {
      return;
    }

    setDeletingTag(tagId);
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchTags();
        router.refresh();
      } else {
        alert(`Failed to delete tag: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    } finally {
      setDeletingTag(null);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tags Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all tags used in your blog posts
            </p>
          </div>
          <Link
            href="/tags"
            target="_blank"
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
          >
            View Public Tags Page
          </Link>
        </div>

        {/* Create New Tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateTag();
              }
            }}
            placeholder="Enter new tag name..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCreateTag}
            disabled={creatingTag || !newTagName.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingTag ? 'Creating...' : 'Create Tag'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tags List */}
      {loading ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading tags...
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-lg text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {searchQuery ? 'No tags found' : 'No tags yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first tag above'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {editingTag === tag.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateTag(tag.id);
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                          setEditTagName('');
                        }
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateTag(tag.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTag(null);
                        setEditTagName('');
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {tag.name}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                          {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                        </span>
                        {tag.publishedCount > 0 && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                            {tag.publishedCount} published
                          </span>
                        )}
                        {tag.draftCount > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded">
                            {tag.draftCount} drafts
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Used in {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                        {tag.publishedCount > 0 && ` (${tag.publishedCount} published)`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTag(tag.id);
                          setEditTagName(tag.name);
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        disabled={deletingTag === tag.id}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {deletingTag === tag.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tags.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Tags
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tags.reduce((sum, tag) => sum + tag.postCount, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Tag Usage
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tags.filter(t => t.postCount === 0).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Unused Tags
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Post Form Component
function CreatePostForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    author: '',
    tags: '',
    excerpt: '',
    coverImage: '',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    galleryImages: [] as Array<{ url: string; favorite: boolean }>,
    // New fields
    category: '',
    series: '',
    seriesOrder: null as number | null,
    slugOverride: '',
    slugLocked: false,
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    scheduledAt: '',
    visibility: 'private' as 'public' | 'unlisted' | 'private', // Drafts default to private
    isPremium: false,
    requiresLogin: false,
    canonicalUrl: '',
    ogImageOverride: '',
    twitterTitle: '',
    twitterDescription: '',
    structuredDataType: 'BlogPosting' as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [savingPreview, setSavingPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word count and reading time
  useEffect(() => {
    const text = formData.content || '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const stats = readingTime(text);
    setReadingTimeMinutes(Math.ceil(stats.minutes));
  }, [formData.content]);

  // Autosave functionality
  const autosaveDraft = useCallback(async () => {
    if (!formData.title && !formData.content) return;
    
    setAutosaveStatus('saving');
    try {
      const draft = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        date: new Date().toISOString(),
      };
      localStorage.setItem('blog_draft_autosave', JSON.stringify(draft));
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (err) {
      setAutosaveStatus('error');
    }
  }, [formData]);

  // Autosave on content change (debounced)
  useEffect(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveDraft();
    }, 2000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formData, autosaveDraft]);

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blog_draft_autosave');
    if (savedDraft && (!formData.title && !formData.content)) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          setShowRestorePrompt(true);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('blog_draft_autosave');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData({
          ...formData,
          ...draft,
          tags: typeof draft.tags === 'string' ? draft.tags : draft.tags?.join(', ') || '',
          galleryImages: Array.isArray(draft.galleryImages) 
            ? draft.galleryImages.map((url: string | { url: string; favorite?: boolean }) => 
                typeof url === 'string' ? { url, favorite: false } : { url: url.url, favorite: url.favorite || false }
              )
            : [],
        });
        setShowRestorePrompt(false);
        localStorage.removeItem('blog_draft_autosave');
      } catch {
        // Ignore parse errors
      }
    }
  };

  const dismissRestorePrompt = () => {
    setShowRestorePrompt(false);
    localStorage.removeItem('blog_draft_autosave');
  };

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const buildPayload = () => {
    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const published = formData.status === 'published' || 
      (formData.status === 'scheduled' && formData.scheduledAt && new Date(formData.scheduledAt) <= new Date());

    return {
      title: formData.title,
      description: formData.description,
      content: formData.content,
      author: formData.author,
      tags: tagsArray,
      date: new Date().toISOString(),
      excerpt: formData.excerpt,
      coverImage: formData.coverImage,
      featured: formData.featured,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      galleryImages: formData.galleryImages.map(img => img.url),
      category: formData.category || undefined,
      series: formData.series || undefined,
      seriesOrder: formData.seriesOrder ?? null,
      slugOverride: formData.slugOverride || undefined,
      slugLocked: formData.slugLocked,
      status: formData.status,
      scheduledAt: formData.scheduledAt || null,
      visibility: formData.visibility,
      isPremium: formData.isPremium,
      requiresLogin: formData.requiresLogin,
      canonicalUrl: formData.canonicalUrl || undefined,
      ogImageOverride: formData.ogImageOverride || undefined,
      twitterTitle: formData.twitterTitle || undefined,
      twitterDescription: formData.twitterDescription || undefined,
      structuredDataType: formData.structuredDataType || undefined,
      published,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = buildPayload();

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        localStorage.removeItem('blog_draft_autosave');
        setFormData({
          title: '',
          description: '',
          content: '',
          author: '',
          tags: '',
          excerpt: '',
          coverImage: '',
          featured: false,
          seoTitle: '',
          seoDescription: '',
          galleryImages: [],
          category: '',
          series: '',
          seriesOrder: null,
          slugOverride: '',
          slugLocked: false,
          status: 'draft',
          scheduledAt: '',
          visibility: 'private', // Drafts default to private
          isPremium: false,
          requiresLogin: false,
          canonicalUrl: '',
          ogImageOverride: '',
          twitterTitle: '',
          twitterDescription: '',
          structuredDataType: 'BlogPosting',
        });
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 2000);
      } else {
        const errorMessage = data.error || 'Failed to create post';
        console.error('Post creation error:', errorMessage, data);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      console.error('Post creation exception:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (openPreview = false) => {
    console.log('handleSaveDraft called, openPreview:', openPreview);
    setError('');
    setSavingPreview(true);

    try {
      // Basic validation - at least title or content should be present for draft
      if (!formData.title.trim() && !formData.content.trim()) {
        const errorMsg = 'Please enter at least a title or content to save a draft.';
        console.warn('Validation failed:', errorMsg);
        setError(errorMsg);
        setSavingPreview(false);
        return;
      }

      // For drafts, we can be more lenient - use title or generate a default
      const draftTitle = formData.title.trim() || 'Untitled Draft';
      const draftAuthor = formData.author.trim() || 'Admin';
      
      // Build payload safely
      let payload;
      try {
        const basePayload = buildPayload();
        payload = {
          ...basePayload,
          title: draftTitle,
          author: draftAuthor,
          status: 'draft',
          published: false,
          visibility: 'private', // Drafts should always be private
        };
      } catch (buildError) {
        console.error('Error building payload:', buildError);
        setError('Error preparing draft data. Please check your form fields.');
        setSavingPreview(false);
        return;
      }

      console.log('Saving draft with payload:', payload);

      // Add timeout to prevent hanging (match database timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 second timeout (slightly less than DB timeout)

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response received, status:', response.status, response.statusText);

      let data;
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        
        data = JSON.parse(responseText);
        console.log('Draft save response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server. Check console for details.');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Server error: ${response.status}`;
        console.error('Response error:', errorMessage, data);
        throw new Error(errorMessage);
      }

      if (data.success) {
        console.log('Draft saved successfully!', data);
        // Show success message
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        if (openPreview) {
          // Open preview in a new tab
          if (data.post?.slug) {
            console.log('Opening preview in new tab with slug:', data.post.slug);
            const previewUrl = `/blog/preview/${encodeURIComponent(data.post.slug)}`;
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
            console.log('Preview opened in new tab:', previewUrl);
          } else {
            console.warn('No slug in response:', data);
            console.warn('Response data:', JSON.stringify(data, null, 2));
            setError('Draft saved but could not get preview URL. Response: ' + JSON.stringify(data));
          }
        } else {
          console.log('Draft saved (preview not requested)');
        }
      } else {
        const errorMessage = data.error || 'Failed to save draft';
        console.error('Draft save error:', errorMessage, data);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving draft. Please try again.';
      console.error('Draft save exception:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. This usually means:\n1. Database connection is not configured properly\n2. Database is unreachable\n3. Check your POSTGRES_URL environment variable\n\nCheck server logs for more details.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSavingPreview(false);
    }
  };

  const handleSaveDraftAndPreview = () => {
    console.log('handleSaveDraftAndPreview called');
    handleSaveDraft(true);
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setCoverUploadError('');
    try {
      setUploadingCover(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slugHint', formData.title || 'post');

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        coverImage: data.url,
      }));
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGalleryUploadError('');
    try {
      setUploadingGallery(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('slugHint', formData.title || 'post');

        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: fd,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
        uploadedUrls.push(data.url);
      }

      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...uploadedUrls.map(url => ({ url, favorite: false }))],
      }));
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Gallery reorder functions
  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const newImages = [...prev.galleryImages];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return { ...prev, galleryImages: newImages };
    });
  };

  const toggleGalleryFavorite = (index: number) => {
    setFormData((prev) => {
      const newImages = [...prev.galleryImages];
      newImages[index] = { ...newImages[index], favorite: !newImages[index].favorite };
      return { ...prev, galleryImages: newImages };
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const copyGalleryImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Quick insert function for markdown toolbar
  const insertAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    const newContent = before + text + after;

    setFormData((prev) => ({ ...prev, content: newContent }));

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
      <div className="border-b border-gray-200/80 dark:border-gray-800/80 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Post
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Draft, design, and preview a new Wiredliving article before publishing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {autosaveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-mono uppercase tracking-wide">Saving...</span>
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="font-mono uppercase tracking-wide">Saved</span>
            </span>
          )}
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="font-mono text-[10px]">{wordCount.toLocaleString()} words • {readingTimeMinutes} min read</span>
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors ${
              showPreview
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-400'
            }`}
          >
            <span>{showPreview ? 'Hide preview' : 'Live preview'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {showRestorePrompt && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-amber-800 dark:text-amber-200 font-medium">
                📝 Draft found! Restore your previous work?
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                You have an autosaved draft. Click restore to continue where you left off.
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={dismissRestorePrompt}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✓ {previewSlug ? 'Draft saved successfully!' : 'Post created successfully!'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              ⚠️ {error}
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-2">
              Check the browser console (F12) for more details.
            </p>
          </div>
        )}

        {savingPreview && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              💾 Saving draft...
            </p>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            // Only submit if it's the actual submit button, not draft buttons
            const target = e.target as HTMLFormElement;
            const submitter = (e.nativeEvent as SubmitEvent).submitter;
            if (submitter && submitter.getAttribute('type') !== 'submit') {
              e.preventDefault();
            }
            handleSubmit(e);
          }} 
          className="space-y-6"
        >
          <div className={`grid gap-8 ${showPreview ? 'xl:grid-cols-[2fr,1.7fr]' : 'lg:grid-cols-3'}`}>
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="E.g. How I'm Building Wiredliving in Public"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="One–two line summary that appears on cards and overview pages."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-500">
                    Markdown supported
                  </span>
                </div>
                <MarkdownToolbar
                  onInsert={insertAtCursor}
                  onInsertImage={() => {
                    if (formData.galleryImages.length > 0) {
                      insertAtCursor(`![](${formData.galleryImages[0].url})`);
                    } else {
                      insertAtCursor('![alt text](https://example.com/image.jpg)');
                    }
                  }}
                  galleryImages={formData.galleryImages}
                />
                <textarea
                  ref={contentTextareaRef}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                  className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder="# Intro — share the story, insights, or deep dive for this post here..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Post details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Melvin Peralta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Technology, Tutorial, News"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Series
                      </label>
                      <input
                        type="text"
                        value={formData.series}
                        onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Series name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.seriesOrder || ''}
                        onChange={(e) => setFormData({ ...formData, seriesOrder: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Custom Slug
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.slugOverride}
                        onChange={(e) => setFormData({ ...formData, slugOverride: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={generateSlug(formData.title) || 'custom-slug'}
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                        <input
                          type="checkbox"
                          checked={formData.slugLocked}
                          onChange={(e) => setFormData({ ...formData, slugLocked: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Lock</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.slugOverride || generateSlug(formData.title) || 'Slug will be generated from title'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="ai, product, shipping, nextjs"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="One or two sentences that hook the reader."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'draft' | 'scheduled' | 'published';
                        // Auto-set visibility: drafts should be private, published should be public
                        const newVisibility = newStatus === 'draft' 
                          ? 'private' 
                          : newStatus === 'published' 
                          ? 'public' 
                          : formData.visibility; // Keep current for scheduled
                        setFormData({ ...formData, status: newStatus, visibility: newVisibility });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'unlisted' | 'private' })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPremium}
                        onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Premium content
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requiresLogin}
                        onChange={(e) => setFormData({ ...formData, requiresLogin: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Require login
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Cover image
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingCover}
                          onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                      </div>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://image.host/your-cover.jpg"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload an image or paste a URL. This is used as the hero/thumbnail.
                      </p>
                      {coverUploadError && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          {coverUploadError}
                        </p>
                      )}
                      {formData.coverImage && (
                        <div className="mt-2 space-y-3">
                          {/* Simple preview */}
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.coverImage}
                              alt="Cover preview"
                              className="w-full h-32 object-cover"
                            />
                          </div>

                          {/* Where this image will appear */}
                          <div className="grid gap-3 text-[11px] text-gray-600 dark:text-gray-400">
                            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 p-3">
                              <p className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                                Thumbnail / card preview
                              </p>
                              <div className="flex gap-3 items-center">
                                <div className="w-16 h-12 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={formData.coverImage}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-2.5 rounded bg-gray-200 dark:bg-gray-800 w-3/4" />
                                  <div className="h-2 rounded bg-gray-200 dark:bg-gray-800 w-full" />
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 p-3">
                              <p className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                                In-post hero preview
                              </p>
                              <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800 mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={formData.coverImage}
                                  alt="Hero preview"
                                  className="w-full h-20 object-cover"
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="h-2.5 rounded bg-gray-200 dark:bg-gray-800 w-4/5" />
                                <div className="h-2 rounded bg-gray-200 dark:bg-gray-800 w-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mark as featured
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  SEO (optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      SEO title
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Custom title for search and social"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      SEO description
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Text that appears under the title in search results."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/canonical-url"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      OG Image Override
                    </label>
                    <input
                      type="url"
                      value={formData.ogImageOverride}
                      onChange={(e) => setFormData({ ...formData, ogImageOverride: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/og-image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Twitter Title
                    </label>
                    <input
                      type="text"
                      value={formData.twitterTitle}
                      onChange={(e) => setFormData({ ...formData, twitterTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Custom Twitter title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Twitter Description
                    </label>
                    <textarea
                      value={formData.twitterDescription}
                      onChange={(e) => setFormData({ ...formData, twitterDescription: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Custom Twitter description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Structured Data Type
                    </label>
                    <select
                      value={formData.structuredDataType}
                      onChange={(e) => setFormData({ ...formData, structuredDataType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="Product">Product</option>
                      <option value="Article">Article</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional images / gallery */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Additional images
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload extra images for your post and drop them into the content with one click.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGallery}
                    onChange={(e) => handleGalleryUpload(e.target.files)}
                    className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                  />
                  {galleryUploadError && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {galleryUploadError}
                    </p>
                  )}
                  {formData.galleryImages.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                      {formData.galleryImages.map((img, idx) => (
                        <div
                          key={img.url + idx}
                          draggable
                          onDragStart={() => setDraggedImageIndex(idx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              moveGalleryImage(draggedImageIndex, idx);
                              setDraggedImageIndex(idx);
                            }
                          }}
                          onDragEnd={() => setDraggedImageIndex(null)}
                          className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                            draggedImageIndex === idx
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : img.favorite
                              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) moveGalleryImage(idx, idx - 1);
                              }}
                              disabled={idx === 0}
                              className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < formData.galleryImages.length - 1) moveGalleryImage(idx, idx + 1);
                              }}
                              disabled={idx === formData.galleryImages.length - 1}
                              className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          <div className="w-12 h-10 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            {img.favorite && (
                              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl">
                                ⭐
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-700 dark:text-gray-200 truncate">
                              {img.url}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => toggleGalleryFavorite(idx)}
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  img.favorite
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                } hover:bg-amber-100 dark:hover:bg-amber-900/40`}
                                title="Toggle favorite"
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  insertAtCursor(`![](${img.url})`);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[10px] text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                              >
                                Insert
                              </button>
                              <button
                                type="button"
                                onClick={() => copyGalleryImageUrl(img.url)}
                                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-[10px] text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showPreview && (
              <div className="space-y-4 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    Full page preview (admin only)
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {previewSlug ? 'Draft saved' : 'Save draft to load preview'}
                  </span>
                </div>
                {previewSlug ? (
                  <iframe
                    src={`/blog/preview/${encodeURIComponent(previewSlug)}`}
                    className="w-full h-[60vh] border-0 bg-white dark:bg-gray-900"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[60vh] px-4 text-xs text-gray-500 dark:text-gray-400">
                    Save a draft with &quot;Save draft &amp; open preview&quot; to see the full blog page here.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-dashed border-gray-200 dark:border-gray-800 mt-2">
            <button
              type="button"
              disabled={savingPreview || loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save draft button clicked');
                handleSaveDraft(false);
              }}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {savingPreview ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={savingPreview || loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save draft & preview button clicked');
                handleSaveDraftAndPreview();
              }}
              className="px-8 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {savingPreview ? 'Saving draft...' : 'Save draft & open preview'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  content: '',
                  author: '',
                  tags: '',
                  excerpt: '',
                  coverImage: '',
                  featured: false,
                  seoTitle: '',
                  seoDescription: '',
                  galleryImages: [],
                  category: '',
                  series: '',
                  seriesOrder: null,
                  slugOverride: '',
                  slugLocked: false,
                  status: 'draft',
                  scheduledAt: '',
                  visibility: 'public',
                  isPremium: false,
                  requiresLogin: false,
                  canonicalUrl: '',
                  ogImageOverride: '',
                  twitterTitle: '',
                  twitterDescription: '',
                  structuredDataType: 'BlogPosting',
                });
                setError('');
                localStorage.removeItem('blog_draft_autosave');
              }}
              className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Post Form Component
function EditPostForm({ post, onSuccess, onCancel }: { post: BlogPost; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: post.title || '',
    description: post.description || '',
    content: post.content || '',
    author: post.author || '',
    tags: post.tags.join(', ') || '',
    excerpt: post.excerpt || '',
    coverImage: post.coverImage || '',
    featured: post.featured || false,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    galleryImages: (post.galleryImages || []).map(url => ({ url, favorite: false })) as Array<{ url: string; favorite: boolean }>,
    category: post.category || '',
    series: post.series || '',
    seriesOrder: post.seriesOrder ?? null,
    slugOverride: post.slugOverride || '',
    slugLocked: post.slugLocked ?? false,
    status: (post.status || (post.published ? 'published' : 'draft')) as 'draft' | 'scheduled' | 'published',
    scheduledAt: post.scheduledAt || '',
    visibility: (post.visibility || (post.published ? 'public' : 'private')) as 'public' | 'unlisted' | 'private',
    isPremium: post.isPremium || false,
    requiresLogin: post.requiresLogin || false,
    canonicalUrl: post.canonicalUrl || '',
    ogImageOverride: post.ogImageOverride || '',
    twitterTitle: post.twitterTitle || '',
    twitterDescription: post.twitterDescription || '',
    structuredDataType: post.structuredDataType || 'BlogPosting',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(post.slug);
  const [wordCount, setWordCount] = useState(0);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(0);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word count and reading time
  useEffect(() => {
    const text = formData.content || '';
    const words = text.split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const stats = readingTime(text);
    setReadingTimeMinutes(Math.ceil(stats.minutes));
  }, [formData.content]);

  const buildPayload = () => {
    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    return {
      slug: post.slug, // Keep existing slug
      slugOverride: formData.slugOverride || null,
      slugLocked: formData.slugLocked,
      title: formData.title,
      description: formData.description || '',
      content: formData.content || '',
      author: formData.author,
      tags: tagsArray,
      date: post.date, // Keep original date
      published: formData.status === 'published',
      status: formData.status,
      scheduledAt: formData.scheduledAt || null,
      visibility: formData.visibility,
      isPremium: formData.isPremium,
      requiresLogin: formData.requiresLogin,
      excerpt: formData.excerpt || null,
      coverImage: formData.coverImage || null,
      featured: formData.featured,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
      ogImageOverride: formData.ogImageOverride || null,
      twitterTitle: formData.twitterTitle || null,
      twitterDescription: formData.twitterDescription || null,
      galleryImages: formData.galleryImages.map(img => img.url),
      category: formData.category || null,
      series: formData.series || null,
      seriesOrder: formData.seriesOrder,
      canonicalUrl: formData.canonicalUrl || null,
      structuredDataType: formData.structuredDataType || null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = buildPayload();

      // Use PUT method for update
      const response = await fetch(`/api/admin/posts/${post.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 2000);
      } else {
        const errorMessage = data.error || 'Failed to update post';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions (same as CreatePostForm)
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const insertAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    const newContent = before + text + after;

    setFormData((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setCoverUploadError('');
    try {
      setUploadingCover(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slugHint', formData.title || post.slug);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        coverImage: data.url,
      }));
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGalleryUploadError('');
    try {
      setUploadingGallery(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('slugHint', formData.title || post.slug);

        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: fd,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
        uploadedUrls.push(data.url);
      }

      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...uploadedUrls.map(url => ({ url, favorite: false }))],
      }));
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const newImages = [...prev.galleryImages];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return { ...prev, galleryImages: newImages };
    });
  };

  const toggleGalleryFavorite = (index: number) => {
    setFormData((prev) => {
      const newImages = [...prev.galleryImages];
      newImages[index] = { ...newImages[index], favorite: !newImages[index].favorite };
      return { ...prev, galleryImages: newImages };
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const copyGalleryImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
      <div className="border-b border-gray-200/80 dark:border-gray-800/80 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Post: {post.title}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update your post content, metadata, and settings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="font-mono text-[10px]">{wordCount.toLocaleString()} words • {readingTimeMinutes} min read</span>
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors ${
              showPreview
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-400'
            }`}
          >
            <span>{showPreview ? 'Hide preview' : 'Live preview'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✓ Post updated successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              ⚠️ {error}
            </p>
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <div className={`grid gap-8 ${showPreview ? 'xl:grid-cols-[2fr,1.7fr]' : 'lg:grid-cols-3'}`}>
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="E.g. How I'm Building Wiredliving in Public"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="One–two line summary that appears on cards and overview pages."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-500">
                    Markdown supported
                  </span>
                </div>
                <MarkdownToolbar
                  onInsert={insertAtCursor}
                  onInsertImage={() => {
                    if (formData.galleryImages.length > 0) {
                      insertAtCursor(`![](${formData.galleryImages[0].url})`);
                    } else {
                      insertAtCursor('![alt text](https://example.com/image.jpg)');
                    }
                  }}
                  galleryImages={formData.galleryImages}
                />
                <textarea
                  ref={contentTextareaRef}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                  className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder="# Intro — share the story, insights, or deep dive for this post here..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Post details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Melvin Peralta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Technology, Tutorial, News"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Series
                      </label>
                      <input
                        type="text"
                        value={formData.series}
                        onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Series name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.seriesOrder || ''}
                        onChange={(e) => setFormData({ ...formData, seriesOrder: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Custom Slug
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.slugOverride}
                        onChange={(e) => setFormData({ ...formData, slugOverride: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={generateSlug(formData.title) || post.slug}
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                        <input
                          type="checkbox"
                          checked={formData.slugLocked}
                          onChange={(e) => setFormData({ ...formData, slugLocked: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Lock</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current slug: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{post.slug}</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="ai, product, shipping, nextjs"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="One or two sentences that hook the reader."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'draft' | 'scheduled' | 'published';
                        const newVisibility = newStatus === 'draft' 
                          ? 'private' 
                          : newStatus === 'published' 
                          ? 'public' 
                          : formData.visibility;
                        setFormData({ ...formData, status: newStatus, visibility: newVisibility });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'unlisted' | 'private' })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPremium}
                        onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Premium content
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requiresLogin}
                        onChange={(e) => setFormData({ ...formData, requiresLogin: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Require login
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Cover image
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingCover}
                          onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                      </div>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://image.host/your-cover.jpg"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload an image or paste a URL. This is used as the hero/thumbnail.
                      </p>
                      {coverUploadError && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          {coverUploadError}
                        </p>
                      )}
                      {formData.coverImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mark as featured
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  SEO (optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      SEO title
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Custom title for search and social"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      SEO description
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Text that appears under the title in search results."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/canonical-url"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      OG Image Override
                    </label>
                    <input
                      type="url"
                      value={formData.ogImageOverride}
                      onChange={(e) => setFormData({ ...formData, ogImageOverride: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/og-image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Twitter Title
                    </label>
                    <input
                      type="text"
                      value={formData.twitterTitle}
                      onChange={(e) => setFormData({ ...formData, twitterTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Custom Twitter title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Twitter Description
                    </label>
                    <textarea
                      value={formData.twitterDescription}
                      onChange={(e) => setFormData({ ...formData, twitterDescription: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Custom Twitter description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Structured Data Type
                    </label>
                    <select
                      value={formData.structuredDataType}
                      onChange={(e) => setFormData({ ...formData, structuredDataType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="Product">Product</option>
                      <option value="Article">Article</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional images / gallery */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Additional images
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload extra images for your post and drop them into the content with one click.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGallery}
                    onChange={(e) => handleGalleryUpload(e.target.files)}
                    className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                  />
                  {galleryUploadError && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {galleryUploadError}
                    </p>
                  )}
                  {formData.galleryImages.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                      {formData.galleryImages.map((img, idx) => (
                        <div
                          key={img.url + idx}
                          draggable
                          onDragStart={() => setDraggedImageIndex(idx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              moveGalleryImage(draggedImageIndex, idx);
                              setDraggedImageIndex(idx);
                            }
                          }}
                          onDragEnd={() => setDraggedImageIndex(null)}
                          className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                            draggedImageIndex === idx
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : img.favorite
                              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) moveGalleryImage(idx, idx - 1);
                              }}
                              disabled={idx === 0}
                              className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < formData.galleryImages.length - 1) moveGalleryImage(idx, idx + 1);
                              }}
                              disabled={idx === formData.galleryImages.length - 1}
                              className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          <div className="w-12 h-10 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            {img.favorite && (
                              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl">
                                ⭐
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-700 dark:text-gray-200 truncate">
                              {img.url}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => toggleGalleryFavorite(idx)}
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  img.favorite
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                } hover:bg-amber-100 dark:hover:bg-amber-900/40`}
                                title="Toggle favorite"
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  insertAtCursor(`![](${img.url})`);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[10px] text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                              >
                                Insert
                              </button>
                              <button
                                type="button"
                                onClick={() => copyGalleryImageUrl(img.url)}
                                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-[10px] text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showPreview && (
              <div className="space-y-4 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    Full page preview (admin only)
                  </span>
                </div>
                {previewSlug ? (
                  <iframe
                    src={`/blog/preview/${encodeURIComponent(previewSlug)}`}
                    className="w-full h-[60vh] border-0 bg-white dark:bg-gray-900"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[60vh] px-4 text-xs text-gray-500 dark:text-gray-400">
                    Preview will appear here after saving
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-dashed border-gray-200 dark:border-gray-800 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
