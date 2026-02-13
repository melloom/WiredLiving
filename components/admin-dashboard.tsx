'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { BlogPost } from '@/types';
import { formatDate, extractImageUrlsFromContent } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import readingTime from 'reading-time';
import { MarkdownToolbar } from '@/components/markdown-toolbar';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { autoFormatContent, getFormattingSummary } from '@/lib/content-auto-formatter';
import { BacklinksGenerator } from '@/components/backlinks-generator';
import { ImageCropModal } from '@/components/image-crop-modal';
import { MediaUploadButton } from '@/components/media-upload-button';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';
import { LiveMarkdownEditor, type LiveMarkdownEditorHandle } from '@/components/live-markdown-editor';
import { generateSmartSEO, validateSEO } from '@/lib/seo-generator';
import { SeriesMetadataModal } from '@/components/series-metadata-modal';
import type { SeriesMetadata } from '@/types';

const supabase = createClient();

interface AdminDashboardProps {
  posts: BlogPost[];
}

type TabType = 'overview' | 'posts' | 'series' | 'analytics' | 'create';

export function AdminDashboard({ posts }: AdminDashboardProps) {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
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
  const [editingSeriesMetadata, setEditingSeriesMetadata] = useState<{name: string; data?: SeriesMetadata} | null>(null);
  const [seriesMetadataMap, setSeriesMetadataMap] = useState<Map<string, SeriesMetadata>>(new Map());

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.published).length,
    draftPosts: posts.filter(p => !p.published).length,
    totalTags: new Set(posts.flatMap(p => p.tags || [])).size,
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
        (post.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
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
    { id: 'series' as TabType, label: 'Series', icon: '📚' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: '📈' },
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
        toast.success('Post updated successfully');
        router.refresh();
      } else {
        toast.error(`Failed to update: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to update post');
    } finally {
      setUpdatingPost(null);
    }
  };

  // Update series order
  const handleUpdateSeriesOrder = async (postSlug: string, newOrder: number) => {
    setUpdatingPost(postSlug);
    try {
      const response = await fetch(`/api/admin/posts/${postSlug}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'seriesOrder', value: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Series order updated');
        router.refresh();
      } else {
        toast.error(`Failed to update order: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to update series order');
    } finally {
      setUpdatingPost(null);
    }
  };

  // Move post in series (swap orders)
  const handleMovePostInSeries = async (post: BlogPost, direction: 'up' | 'down', seriesPosts: BlogPost[]) => {
    const currentIndex = seriesPosts.findIndex(p => p.slug === post.slug);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === seriesPosts.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentPost = seriesPosts[currentIndex];
    const swapPost = seriesPosts[swapIndex];

    const currentOrder = currentPost.seriesOrder ?? currentIndex + 1;
    const swapOrder = swapPost.seriesOrder ?? swapIndex + 1;

    setUpdatingPost(post.slug);
    try {
      // Update both posts
      await Promise.all([
        fetch(`/api/admin/posts/${currentPost.slug}/quick-update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'seriesOrder', value: swapOrder }),
        }),
        fetch(`/api/admin/posts/${swapPost.slug}/quick-update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'seriesOrder', value: currentOrder }),
        }),
      ]);

      toast.success('Posts reordered successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to reorder posts');
    } finally {
      setUpdatingPost(null);
    }
  };

  // Save series metadata
  const handleSaveSeriesMetadata = async (metadata: Partial<SeriesMetadata> & { name: string }) => {
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error('Failed to save series metadata');
      }

      const savedMetadata = await response.json();

      // Update local state
      setSeriesMetadataMap(prev => {
        const newMap = new Map(prev);
        newMap.set(savedMetadata.name, savedMetadata);
        return newMap;
      });

      toast.success('Series settings saved');
      setEditingSeriesMetadata(null);
      router.refresh();
    } catch (error) {
      console.error('Error saving series metadata:', error);
      toast.error('Failed to save series settings');
    }
  };

  // Move post to different series
  const handleMoveToSeries = async (postSlug: string, newSeries: string, newOrder: number = 1) => {
    setUpdatingPost(postSlug);
    try {
      const response = await fetch(`/api/admin/posts/${postSlug}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { field: 'series', value: newSeries },
            { field: 'seriesOrder', value: newOrder }
          ]
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Moved to ${newSeries}`);
        router.refresh();
      } else {
        toast.error(`Failed to move: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to move post');
    } finally {
      setUpdatingPost(null);
    }
  };

  // Delete post function
  const handleDeletePost = async (postSlug: string, postTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setDeletingPost(postSlug);
    try {
      const response = await fetch(`/api/admin/posts/${postSlug}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Post deleted successfully');
        router.refresh();
      } else {
        toast.error(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to delete post');
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

  // Fetch series metadata when series tab is opened
  useEffect(() => {
    if (activeTab === 'series') {
      fetch('/api/series')
        .then(res => res.json())
        .then((data: SeriesMetadata[]) => {
          const map = new Map<string, SeriesMetadata>();
          data.forEach(metadata => {
            map.set(metadata.name, metadata);
          });
          setSeriesMetadataMap(map);
        })
        .catch(err => {
          console.error('Error fetching series metadata:', err);
        });
    }
  }, [activeTab]);

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
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Site
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
      {/* Series Metadata Modal */}
      {editingSeriesMetadata && (
        <SeriesMetadataModal
          open={!!editingSeriesMetadata}
          name={editingSeriesMetadata.name}
          initialData={editingSeriesMetadata.data}
          onClose={() => setEditingSeriesMetadata(null)}
          onSave={handleSaveSeriesMetadata}
        />
      )}

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
                    aria-label="Sort posts"
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
                        {/* Cover Image Thumbnail */}
                        {post.coverImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-32 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        )}
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
                            {(post.tags || []).length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {(post.tags || []).map((tag) => (
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

        {/* Series Tab */}
        {activeTab === 'series' && (
          <div className="space-y-6">
            {(() => {
              // Group posts by series
              const seriesMap = new Map<string, BlogPost[]>();
              const postsWithoutSeries: BlogPost[] = [];

              posts.forEach(post => {
                if (post.series) {
                  if (!seriesMap.has(post.series)) {
                    seriesMap.set(post.series, []);
                  }
                  seriesMap.get(post.series)!.push(post);
                } else {
                  postsWithoutSeries.push(post);
                }
              });

              // Sort posts within each series by seriesOrder
              seriesMap.forEach(seriesPosts => {
                seriesPosts.sort((a, b) => {
                  const orderA = a.seriesOrder ?? 999;
                  const orderB = b.seriesOrder ?? 999;
                  return orderA - orderB;
                });
              });

              const seriesArray = Array.from(seriesMap.entries()).sort((a, b) =>
                a[0].localeCompare(b[0])
              );

              // Calculate overall stats
              const totalSeries = seriesArray.length;
              const totalSeriesPosts = posts.filter(p => p.series).length;
              const completeSeries = seriesArray.filter(([_, posts]) => posts.every(p => p.published)).length;

              return (
                <>
                  {/* Header Section */}
                  <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                          <span className="text-4xl">📚</span>
                          Series Management
                        </h2>
                        <p className="text-white/80 text-sm">Organize and manage your blog post series</p>
                      </div>
                      <Link
                        href="/series"
                        target="_blank"
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all font-semibold border border-white/30 shadow-lg"
                      >
                        👁️ View Series Page
                      </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">{totalSeries}</div>
                        <div className="text-white/80 text-sm">Total Series</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">{totalSeriesPosts}</div>
                        <div className="text-white/80 text-sm">Posts in Series</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">{completeSeries}</div>
                        <div className="text-white/80 text-sm">Complete Series</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">{postsWithoutSeries.length}</div>
                        <div className="text-white/80 text-sm">Standalone Posts</div>
                      </div>
                    </div>
                  </div>

                  {/* Series List */}
                  {seriesArray.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-lg text-center">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No series yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">Start organizing your content by creating a series</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
                      >
                        ➕ Create First Post
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {seriesArray.map(([seriesName, seriesPosts], idx) => {
                        const publishedCount = seriesPosts.filter(p => p.published).length;
                        const draftCount = seriesPosts.length - publishedCount;
                        const totalWords = seriesPosts.reduce((sum, p) => sum + (p.content?.split(' ').length || 0), 0);
                        const totalReadingTime = seriesPosts.reduce((sum, p) => sum + (p.readingTime || 0), 0);
                        const avgReadingTime = seriesPosts.length > 0 ? Math.round(totalReadingTime / seriesPosts.length) : 0;
                        const isComplete = publishedCount === seriesPosts.length;
                        const hasOrderIssues = seriesPosts.some(p => p.seriesOrder === null || p.seriesOrder === undefined);

                        // Define gradient colors for each series
                        const gradients = [
                          'from-blue-500 to-cyan-500',
                          'from-purple-500 to-pink-500',
                          'from-green-500 to-emerald-500',
                          'from-orange-500 to-red-500',
                          'from-indigo-500 to-purple-500',
                          'from-teal-500 to-green-500',
                        ];
                        const gradient = gradients[idx % gradients.length];

                        return (
                          <div key={seriesName} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            {/* Series Header with Gradient */}
                            <div className={`bg-gradient-to-r ${gradient} p-6 text-white relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-black/10"></div>
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-2xl font-bold">
                                        {seriesName}
                                      </h3>
                                      {isComplete && (
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30">
                                          ✓ Complete
                                        </span>
                                      )}
                                      {hasOrderIssues && (
                                        <span className="px-3 py-1 bg-yellow-500/30 backdrop-blur-sm rounded-full text-xs font-semibold border border-yellow-400/50" title="Some posts are missing series order numbers">
                                          ⚠️ Order Issues
                                        </span>
                                      )}
                                    </div>

                                    {/* Mini Stats */}
                                    <div className="flex flex-wrap gap-4 text-sm text-white/90">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">📄</span>
                                        <span className="font-semibold">{seriesPosts.length}</span>
                                        <span className="text-white/70">{seriesPosts.length === 1 ? 'part' : 'parts'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">✓</span>
                                        <span className="font-semibold">{publishedCount}</span>
                                        <span className="text-white/70">published</span>
                                      </div>
                                      {draftCount > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">○</span>
                                          <span className="font-semibold">{draftCount}</span>
                                          <span className="text-white/70">draft{draftCount > 1 ? 's' : ''}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">📖</span>
                                        <span className="font-semibold">{totalReadingTime}</span>
                                        <span className="text-white/70">min total</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">✍️</span>
                                        <span className="font-semibold">{totalWords.toLocaleString()}</span>
                                        <span className="text-white/70">words</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 items-end">
                                    <Link
                                      href={`/series/${encodeURIComponent(seriesName.toLowerCase().replace(/\s+/g, '-'))}`}
                                      target="_blank"
                                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all font-medium border border-white/30 text-sm shrink-0"
                                    >
                                      👁️ View
                                    </Link>
                                    <button
                                      className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600 text-white rounded-lg transition-all font-medium border border-blue-700/30 text-sm shrink-0 mt-1"
                                      onClick={() => setEditingSeriesMetadata({ name: seriesName, data: seriesMetadataMap.get(seriesName) })}
                                    >
                                      ✏️ Edit Series
                                    </button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                                  <div
                                    className="bg-white h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(publishedCount / seriesPosts.length) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-white/80 mt-1">
                                  {Math.round((publishedCount / seriesPosts.length) * 100)}% published
                                </div>
                              </div>
                            </div>

                            {/* Posts List */}
                            <div className="p-6 space-y-2">
                              {seriesPosts.map((post, postIdx) => (
                                <div
                                  key={post.slug}
                                  className="group bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl p-4 transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Order Number */}
                                    <div className="shrink-0">
                                      <div className={`w-10 h-10 rounded-lg ${gradient} bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-sm`}>
                                        {post.seriesOrder ?? '?'}
                                      </div>
                                    </div>

                                    {/* Post Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <Link
                                          href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                                          target="_blank"
                                          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group-hover:underline"
                                        >
                                          {post.title}
                                        </Link>

                                        {/* Status Badge */}
                                        <span className={`shrink-0 px-2 py-1 rounded-md text-xs font-medium ${
                                          post.published
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                        }`}>
                                          {post.published ? '✓ Published' : '○ Draft'}
                                        </span>
                                      </div>

                                      {/* Meta Info */}
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        <span className="flex items-center gap-1">
                                          📅 {formatDate(post.date)}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          ⏱️ {post.readingTime || 0} min
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          ✍️ {(post.content?.split(' ').length || 0).toLocaleString()} words
                                        </span>
                                        {post.tags && post.tags.length > 0 && (
                                          <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                              🏷️ {post.tags.length} {post.tags.length === 1 ? 'tag' : 'tags'}
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {/* Description */}
                                      {post.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                          {post.description}
                                        </p>
                                      )}

                                      {/* Actions */}
                                      <div className="flex flex-wrap gap-2">
                                        {/* Reorder buttons */}
                                        <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                          <button
                                            onClick={() => handleMovePostInSeries(post, 'up', seriesPosts)}
                                            disabled={postIdx === 0 || updatingPost === post.slug}
                                            className="px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up in series"
                                          >
                                            ↑
                                          </button>
                                          <button
                                            onClick={() => handleMovePostInSeries(post, 'down', seriesPosts)}
                                            disabled={postIdx === seriesPosts.length - 1 || updatingPost === post.slug}
                                            className="px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down in series"
                                          >
                                            ↓
                                          </button>
                                        </div>

                                        <button
                                          onClick={() => {
                                            setEditingPost(post);
                                            setActiveTab('create');
                                          }}
                                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <Link
                                          href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                                          target="_blank"
                                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
                                        >
                                          👁️ {post.published ? 'View' : 'Preview'}
                                        </Link>

                                        {/* Remove from series button */}
                                        <button
                                          onClick={async () => {
                                            const confirmed = await confirm({
                                              title: 'Remove from Series',
                                              message: `Remove "${post.title}" from this series?`,
                                              confirmText: 'Remove',
                                              cancelText: 'Cancel',
                                            });
                                            if (confirmed) {
                                              await handleMoveToSeries(post.slug, '', 0);
                                            }
                                          }}
                                          disabled={updatingPost === post.slug}
                                          className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium disabled:opacity-50"
                                          title="Remove from series"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Posts Without Series */}
                  {postsWithoutSeries.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-700 dark:to-gray-800 p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                              <span className="text-2xl">📝</span>
                              Standalone Posts
                            </h3>
                            <p className="text-white/80 text-sm">
                              {postsWithoutSeries.length} {postsWithoutSeries.length === 1 ? 'post' : 'posts'} not part of any series
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid gap-3">
                          {postsWithoutSeries.slice(0, 10).map(post => (
                            <div key={post.slug} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all border border-gray-200 dark:border-gray-700 group">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                                  target="_blank"
                                  className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate group-hover:underline"
                                >
                                  {post.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatDate(post.date)}</span>
                                  <span>•</span>
                                  <span>{post.readingTime || 0} min read</span>
                                  <span>•</span>
                                  <span className={post.published ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                                    {post.published ? '✓ Published' : '○ Draft'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {seriesArray.length > 0 && (
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const [seriesName, maxOrder] = e.target.value.split('|||');
                                        const newOrder = parseInt(maxOrder) + 1;
                                        handleMoveToSeries(post.slug, seriesName, newOrder);
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={updatingPost === post.slug}
                                    className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium border-0 cursor-pointer disabled:opacity-50"
                                  >
                                    <option value="">➕ Quick Add...</option>
                                    {seriesArray.map(([name, posts]) => {
                                      const maxOrder = Math.max(...posts.map(p => p.seriesOrder || 0));
                                      return (
                                        <option key={name} value={`${name}|||${maxOrder}`}>
                                          Add to "{name}" (as #{maxOrder + 1})
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setActiveTab('create');
                                  }}
                                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            </div>
                          ))}
                          {postsWithoutSeries.length > 10 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                ...and {postsWithoutSeries.length - 10} more standalone {postsWithoutSeries.length - 10 === 1 ? 'post' : 'posts'}
                              </p>
                              <button
                                onClick={() => setActiveTab('posts')}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                View all posts →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
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
                  aria-label="Close edit modal"
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

// Create Post Form Component
function CreatePostForm({ onSuccess }: { onSuccess: () => void }) {
  const toast = useToast();
  const [existingSeries, setExistingSeries] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    author: '',
    tags: '',
    excerpt: '',
    coverImage: '',
    coverImageCrop: undefined as { x: number; y: number; width: number; height: number; objectPosition?: string } | undefined,
    featured: false,
    seoTitle: '',
    seoDescription: '',
    galleryImages: [] as Array<{ url: string; favorite: boolean; size?: 'small'|'medium'|'large'|'full' }>,
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
    relatedLinks: [] as Array<{ title: string; url: string; description?: string }>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const [galleryUrlValue, setGalleryUrlValue] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [savingPreview, setSavingPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<LiveMarkdownEditorHandle>(null);
  const coverObjectPosition = formData.coverImageCrop?.objectPosition || 'center';

  // Sync image/GIF URLs from content into additional images gallery (so inserted GIFs show up automatically)
  useEffect(() => {
    const urls = extractImageUrlsFromContent(formData.content || '');
    const existing = new Set(formData.galleryImages.map((img) => img.url));
    const toAdd = urls.filter((u) => !existing.has(u));
    if (toAdd.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      galleryImages: [
        ...prev.galleryImages,
        ...toAdd.map((url) => ({ url, favorite: false, size: 'medium' as const })),
      ],
    }));
  }, [formData.content]);

  // Fetch existing series from database
  useEffect(() => {
    async function fetchSeries() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('series')
          .not('series', 'is', null)
          .order('series');

        if (error) throw error;

        // Get unique series names
        const uniqueSeries = Array.from(new Set(
          data?.map(p => p.series).filter(Boolean) || []
        )) as string[];

        setExistingSeries(uniqueSeries);
      } catch (error) {
        console.error('Error fetching series:', error);
      }
    }
    fetchSeries();
  }, []);

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
      } catch (_error) {
        // Ignore parse errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ? draft.galleryImages.map((url: string | { url: string; favorite?: boolean; size?: 'small'|'medium'|'large'|'full' }) =>
                typeof url === 'string' ? { url, favorite: false, size: 'medium' as const } : { url: url.url, favorite: url.favorite || false, size: url.size ?? 'medium' }
              )
            : [],
        });
        setShowRestorePrompt(false);
        localStorage.removeItem('blog_draft_autosave');
      } catch (_error) {
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

    // AUTO-FORMAT CONTENT before building payload
    const formattingResult = autoFormatContent(formData.content);
    const formattedContent = formattingResult.formattedContent;

    const published = formData.status === 'published' ||
      (formData.status === 'scheduled' && formData.scheduledAt && new Date(formData.scheduledAt) <= new Date());

    return {
      title: formData.title,
      description: formData.description,
      content: formattedContent, // Use auto-formatted content!
      author: formData.author,
      tags: tagsArray,
      date: new Date().toISOString(),
      excerpt: formData.excerpt,
      coverImage: formData.coverImage,
      coverImageCrop: formData.coverImageCrop,
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
      relatedLinks: formData.relatedLinks || [],
      published,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = buildPayload();

      // Get formatting summary for notification
      const formattingResult = autoFormatContent(formData.content);
      const formattingSummary = getFormattingSummary(formattingResult);

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(responseText);

      if (response.ok && data.success) {
        setSuccess(true);
        localStorage.removeItem('blog_draft_autosave');

        // Log formatting info
        toast.success('Post created with formatting applied!');

        setFormData({
          title: '',
          description: '',
          content: '',
          author: '',
          tags: '',
          excerpt: '',
          coverImage: '',
          coverImageCrop: undefined,
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
          relatedLinks: [],
        });
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 2000);
      } else {
        const errorMessage = data.error || 'Failed to create post';
        toast.error(`Post creation error: ${errorMessage}`);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      toast.error('An unexpected error occurred while creating the post.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (openPreview = false) => {
    // Draft save requested
    setError('');
    setSavingPreview(true);

    try {
      // Basic validation - at least title or content should be present for draft
      if (!formData.title.trim() && !formData.content.trim()) {
        const errorMsg = 'Please enter at least a title or content to save a draft.';
        toast.warning(`Validation failed: ${errorMsg}`);
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

        // Set the preview slug so the iframe preview can work
        if (data.post?.slug) {
          setPreviewSlug(data.post.slug);
          console.log('Preview slug set:', data.post.slug);
        }

        // Show success message
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        if (openPreview) {
          // Open preview in a new tab AND show in iframe
          if (data.post?.slug) {
            console.log('Opening preview in new tab with slug:', data.post.slug);
            const previewUrl = `/blog/preview/${encodeURIComponent(data.post.slug)}`;
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
            console.log('Preview opened in new tab:', previewUrl);

            // Enable the preview panel if not already shown
            if (!showPreview) {
              setShowPreview(true);
            }
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
        galleryImages: [...prev.galleryImages, ...uploadedUrls.map(url => ({ url, favorite: false, size: 'medium' as const }))],
      }));
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Add gallery image from URL (Giphy, direct links, etc.)
  const handleGalleryUrlAdd = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setGalleryUploadError('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      setGalleryUploadError('Invalid URL format');
      return;
    }

    // Add to gallery
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, { url: trimmedUrl, favorite: false, size: 'medium' as const }],
    }));
    setGalleryUploadError('');
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
    } catch (_error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Quick insert function — delegates to editor ref so gallery/toolbar inserts go to the right textarea
  const insertAtCursor = (text: string) => {
    editorRef.current?.insertAtCursor(text);
  };

  // Size class for gallery insert (works for images and GIFs in mdx-content)
  const getSizeClass = (size: 'small'|'medium'|'large'|'full' = 'medium') =>
    size === 'full' ? 'full-width' : `size-${size}`;

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
          {/* Temporarily hide until LiveMarkdownEditor supports these */}
          {/*
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
          */}
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
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                Restore
              </button>
              <button
                type="button"
                onClick={dismissRestorePrompt}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
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
{/* Quick Insert Links Panel */}
                <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>⚡</span> Quick Insert
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => insertAtCursor('[About](/about)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert About link">📄 About</button>
                    <button type="button" onClick={() => insertAtCursor('[Contact](/contact)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Contact link">📧 Contact</button>
                    <button type="button" onClick={() => insertAtCursor('[Blog](/blog)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Blog link">📝 Blog</button>
                    <button type="button" onClick={() => insertAtCursor('[FAQ](/faq)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert FAQ link">❓ FAQ</button>
                    <button type="button" onClick={() => insertAtCursor('[Resources](/resources)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Resources link">🔧 Resources</button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button type="button" onClick={() => insertAtCursor('[contact@wiredliving.com](mailto:contact@wiredliving.com)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert email">✉️ Email</button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button type="button" onClick={() => insertAtCursor('| Column 1 | Column 2 | Column 3 |\\n|----------|----------|----------|\\n| Data 1   | Data 2   | Data 3   |')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert table">📋 Table</button>
                    <button type="button" onClick={() => insertAtCursor('```chart\\ntype: bar\\ndata:\\n  labels: [Q1, Q2, Q3, Q4]\\n  values: [10, 20, 30, 40]\\n```')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert chart">📊 Chart</button>
                    <button type="button" onClick={() => insertAtCursor('> **Note:** Important callout or note.\\n')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert note">💡 Note</button>
                    <button type="button" onClick={() => insertAtCursor('```javascript\\n// Code here\\nconst example = \"Hello World\";\\nconsole.log(example);\\n```')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert code">💻 Code</button>
                    <button type="button" onClick={() => insertAtCursor('---\\n\\n**TL;DR:** Quick summary.\\n\\n---\\n')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert TL;DR">⚡ TL;DR</button>
                  </div>
                </div>

                <div className="mt-2">
                  <LiveMarkdownEditor
                    ref={editorRef}
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="# Intro — share the story, insights, or deep dive for this post here..."
                    galleryImages={formData.galleryImages}
                    title={formData.title}
                    onFormat={(formatted) => setFormData({ ...formData, content: formatted })}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    SEO (optional)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      // Use smart SEO generator
                      const seoResult = generateSmartSEO(
                        formData.title || '',
                        formData.description || '',
                        formData.content || '',
                        formData.category
                      );

                      // Validate and show warnings if any
                      const validation = validateSEO(seoResult);
                      if (!validation.valid && validation.warnings.length > 0) {
                        console.log('SEO Suggestions:', validation.warnings);
                      }

                      setFormData({
                        ...formData,
                        seoTitle: seoResult.seoTitle,
                        seoDescription: seoResult.seoDescription,
                        twitterTitle: seoResult.twitterTitle,
                        twitterDescription: seoResult.twitterDescription,
                      });

                      // Show success message
                      toast.success( '✨ Smart SEO generated successfully!');
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Smart SEO
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="md:col-span-2">
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
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" htmlFor="structuredDataTypeCreate">
                      Structured Data Type
                    </label>
                    <select
                      id="structuredDataTypeCreate"
                      value={formData.structuredDataType}
                      onChange={(e) => setFormData({ ...formData, structuredDataType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Structured data type"
                    >
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="Product">Product</option>
                      <option value="Article">Article</option>
                    </select>
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
                  <div className="md:col-span-2">
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
                </div>
              </div>
              {/* Additional images / gallery - Below SEO section */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  📸 Additional images
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload images or add from URL (Giphy, direct links). Click position buttons to insert.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingGallery}
                      onChange={(e) => handleGalleryUpload(e.target.files)}
                      className="block flex-1 text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                      aria-label="Upload gallery images"
                      title="Upload gallery images"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
                      disabled={uploadingGallery}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        showGalleryUrlInput
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                      }`}
                      title="Add image from URL (Giphy, Tenor, direct links)"
                    >
                      🔗 URL
                    </button>
                  </div>
                  {showGalleryUrlInput && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <input
                        type="text"
                        value={galleryUrlValue}
                        onChange={(e) => setGalleryUrlValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGalleryUrlAdd(galleryUrlValue);
                            setGalleryUrlValue('');
                          } else if (e.key === 'Escape') {
                            setShowGalleryUrlInput(false);
                            setGalleryUrlValue('');
                          }
                        }}
                        placeholder="Paste Giphy, Tenor, or direct image URL..."
                        className="flex-1 px-3 py-1.5 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleGalleryUrlAdd(galleryUrlValue);
                          setGalleryUrlValue('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGalleryUrlInput(false);
                          setGalleryUrlValue('');
                        }}
                        className="px-2 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {galleryUploadError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{galleryUploadError}</p>
                  )}
                  {formData.galleryImages.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-auto">
                      {formData.galleryImages.map((img, idx) => {
                        const size = img.size ?? 'medium';
                        const sizeClass = getSizeClass(size);
                        const insertImg = (align: 'center' | 'right' | 'left' | 'full') => {
                          if (align === 'full') {
                            insertAtCursor(`<img src="${img.url}" alt="" class="full-width" />`);
                          } else if (align === 'center') {
                            insertAtCursor(`<img src="${img.url}" alt="" class="${sizeClass}" />`);
                          } else {
                            insertAtCursor(`<img src="${img.url}" alt="" align="${align}" class="${sizeClass}" />`);
                          }
                        };
                        return (
                          <div key={img.url + idx} className="flex flex-col gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-950">
                            <img src={img.url} alt="" className="w-full aspect-video object-cover rounded" />
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">Size</div>
                            <div className="flex flex-wrap gap-0.5">
                              {(['small', 'medium', 'large', 'full'] as const).map((s) => (
                                <button key={s} type="button" onClick={() => setFormData((prev) => { const next = [...prev.galleryImages]; next[idx] = { ...next[idx], size: s }; return { ...prev, galleryImages: next }; })} className={`px-1 py-0.5 rounded text-[9px] ${size === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{s === 'full' ? 'Full' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <button type="button" onClick={() => insertImg('center')} className="px-1 py-1 rounded bg-blue-50 dark:bg-blue-900/40 text-[9px] text-blue-700 dark:text-blue-200">📐 Center</button>
                              <button type="button" onClick={() => insertImg('right')} className="px-1 py-1 rounded bg-green-50 dark:bg-green-900/40 text-[9px] text-green-700 dark:text-green-200">➡️ Right</button>
                              <button type="button" onClick={() => insertImg('left')} className="px-1 py-1 rounded bg-purple-50 dark:bg-purple-900/40 text-[9px] text-purple-700 dark:text-purple-200">⬅️ Left</button>
                              <button type="button" onClick={() => insertImg('full')} className="px-1 py-1 rounded bg-indigo-50 dark:bg-indigo-900/40 text-[9px] text-indigo-700 dark:text-indigo-200">↔️ Full</button>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => copyGalleryImageUrl(img.url)} className="flex-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px]">Copy</button>
                              <button type="button" onClick={() => removeGalleryImage(idx)} className="flex-1 px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-[9px] text-red-600">Remove</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Backlinks & Quick Links Generator */}
              <div className="bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-blue-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-blue-900/10 rounded-xl p-1 border border-blue-200/50 dark:border-blue-800/50">
                <BacklinksGenerator
                  postTitle={formData.title || 'this post'}
                  postUrl={previewSlug ? `/blog/${previewSlug}` : '/blog/your-post'}
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Post details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Who wrote this post? Enter your name or the author's name. This appears on the post and helps identify who created the content.">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Melvin Peralta"
                      title="Who wrote this post? Enter your name or the author's name. This appears on the post and helps identify who created the content."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What topic does this post cover? Categories help organize your blog and let readers find similar content (e.g., Technology, Cooking, Travel).">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Technology, Tutorial, News"
                      title="What topic does this post cover? Categories help organize your blog and let readers find similar content (e.g., Technology, Cooking, Travel)."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Is this part of a series? If you're writing multiple related posts, give them the same series name to group them together.">
                        Series {existingSeries.length > 0 && <span className="text-gray-400 font-normal">({existingSeries.length} existing)</span>}
                      </label>
                      <select
                        value={formData.series}
                        onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        title="Is this part of a series? If you're writing multiple related posts, give them the same series name to group them together."
                      >
                        <option value="">Select a series...</option>
                        <option value="">───────────</option>
                        {existingSeries.map((series) => (
                          <option key={series} value={series}>
                            {series}
                          </option>
                        ))}
                        <option value="">───────────</option>
                        <option value="[create-new]">+ Create New Series</option>
                      </select>
                      {formData.series === '[create-new]' && (
                        <input
                          type="text"
                          value={formData.series === '[create-new]' ? '' : formData.series}
                          onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                          className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Enter new series name..."
                          autoFocus
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What order should this post appear in the series? Use numbers like 1, 2, 3 to order your posts from first to last.">
                        Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.seriesOrder || ''}
                        onChange={(e) => setFormData({ ...formData, seriesOrder: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="1"
                        title="What order should this post appear in the series? Use numbers like 1, 2, 3 to order your posts from first to last."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="The URL-friendly version of your title. Usually auto-generated, but you can customize it. Use only letters, numbers, and hyphens. Lock it to prevent changes.">
                      Custom Slug
                    </label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        value={formData.slugOverride}
                        onChange={(e) => setFormData({ ...formData, slugOverride: e.target.value })}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={generateSlug(formData.title) || 'custom-slug'}
                        title="The URL-friendly version of your title. Usually auto-generated, but you can customize it. Use only letters, numbers, and hyphens."
                      />
                      <label className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 flex-shrink-0" title="Lock the slug to prevent it from changing even if you update the title.">
                        <input
                          type="checkbox"
                          checked={formData.slugLocked}
                          onChange={(e) => setFormData({ ...formData, slugLocked: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Lock</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.slugOverride || generateSlug(formData.title) || 'Slug will be generated from title'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Keywords that describe your post. Use comma-separated tags to help readers find your content. Examples: javascript, cooking, travel, tips">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="ai, product, shipping, nextjs"
                      title="Keywords that describe your post. Use comma-separated tags to help readers find your content. Examples: javascript, cooking, travel, tips"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="A short preview of your post. Write 1-2 sentences that grab attention and make people want to read more. This appears on your blog's home page and in search results.">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="One or two sentences that hook the reader."
                      title="A short preview of your post. Write 1-2 sentences that grab attention and make people want to read more. This appears on your blog's home page and in search results."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What's the current state of your post? Draft = not published yet, Scheduled = will publish later, Published = live and visible to everyone.">
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
                      title="What's the current state of your post? Draft = not published yet, Scheduled = will publish later, Published = live and visible to everyone."
                      aria-label="Post status"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="When should this post go live? Pick a date and time, and the post will automatically publish at that moment.">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        title="When should this post go live? Pick a date and time, and the post will automatically publish at that moment."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Who can see this post? Public = everyone, Unlisted = only people with the link, Private = only you.">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'unlisted' | 'private' })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      title="Who can see this post? Public = everyone, Unlisted = only people with the link, Private = only you."
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="The main image for your post. Upload a file or paste an image URL. This appears at the top of your post and as a thumbnail on your blog's listing pages.">
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
                          title="Upload an image file from your computer"
                        />
                      </div>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://image.host/your-cover.jpg"
                        title="Or paste an image URL here. The image will appear at the top of your post and as a thumbnail."
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
                          {/* Crop Button */}
                          {formData.featured && (
                            <button
                              type="button"
                              onClick={() => setShowCropModal(true)}
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Crop for Home Page Featured Card
                            </button>
                          )}

                          {/* Simple preview */}
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.coverImage}
                              alt="Cover preview"
                              className="w-full h-32 object-cover cover-object-position"
                            />
                          </div>

                          {formData.featured && formData.coverImageCrop && (
                            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                                ✓ Crop applied: {formData.coverImageCrop.objectPosition}
                              </p>
                            </div>
                          )}

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
                                    className="w-full h-full object-cover cover-object-position"
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
                                  className="w-full h-20 object-cover cover-object-position"
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
                    <label className="inline-flex items-center gap-2" title="Highlight this post as one of your best. Featured posts get special attention and may appear at the top of your blog or in special sections.">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked, coverImageCrop: e.target.checked ? formData.coverImageCrop : undefined })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mark as featured
                      </span>
                    </label>
                    {formData.featured && formData.coverImage && !formData.coverImageCrop && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 ml-6">
                        💡 Tip: Use the crop button above to adjust how this image appears on the home page
                      </p>
                    )}
                  </div>
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
                    title="Draft preview iframe"
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
                  coverImageCrop: undefined,
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
                  relatedLinks: [],
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

        {/* Crop Modal */}
        {showCropModal && formData.coverImage && (
          <ImageCropModal
            imageUrl={formData.coverImage}
            initialCrop={formData.coverImageCrop}
            onSave={(cropData) => {
              setFormData({ ...formData, coverImageCrop: cropData });
              setShowCropModal(false);
            }}
            onClose={() => setShowCropModal(false)}
          />
        )}
        <style jsx>{`
          .cover-object-position {
            object-position: ${coverObjectPosition};
          }
        `}</style>
      </div>
    </div>
  );
}

// Edit Post Form Component
function EditPostForm({ post, onSuccess, onCancel }: { post: BlogPost; onSuccess: () => void; onCancel: () => void }) {
  const toast = useToast();
  const [existingSeries, setExistingSeries] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: post.title || '',
    description: post.description || '',
    content: post.content || '',
    author: post.author || '',
    tags: (post.tags || []).join(', ') || '',
    excerpt: post.excerpt || '',
    coverImage: post.coverImage || '',
    coverImageCrop: post.coverImageCrop || undefined,
    featured: post.featured || false,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    galleryImages: (post.galleryImages || []).map(url => ({ url, favorite: false, size: 'medium' as const })) as Array<{ url: string; favorite: boolean; size?: 'small'|'medium'|'large'|'full' }>,
    category: post.category || '',
    series: post.series || '',
    seriesOrder: post.seriesOrder ?? null,
    slugOverride: post.slugOverride || '',
    slugLocked: post.slugLocked ?? false,
    status: (post.status || (post.published ? 'published' : 'draft')) as 'draft' | 'scheduled' | 'published',
    scheduledAt: post.scheduledAt ? (typeof post.scheduledAt === 'string' ? post.scheduledAt : post.scheduledAt.toISOString().slice(0, 16)) : '',
    visibility: (post.visibility || (post.published ? 'public' : 'private')) as 'public' | 'unlisted' | 'private',
    isPremium: post.isPremium || false,
    requiresLogin: post.requiresLogin || false,
    canonicalUrl: post.canonicalUrl || '',
    ogImageOverride: post.ogImageOverride || '',
    twitterTitle: post.twitterTitle || '',
    twitterDescription: post.twitterDescription || '',
    structuredDataType: post.structuredDataType || 'BlogPosting',
    relatedLinks: (post.relatedLinks || []) as Array<{ title: string; url: string; description?: string }>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const [galleryUrlValue, setGalleryUrlValue] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(post.slug);
  const [wordCount, setWordCount] = useState(0);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(0);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const editorRef = useRef<LiveMarkdownEditorHandle>(null);
  const coverObjectPosition = formData.coverImageCrop?.objectPosition || 'center';

  // Sync image/GIF URLs from content into additional images gallery (edit form)
  useEffect(() => {
    const urls = extractImageUrlsFromContent(formData.content || '');
    const existing = new Set(formData.galleryImages.map((img) => img.url));
    const toAdd = urls.filter((u) => !existing.has(u));
    if (toAdd.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      galleryImages: [
        ...prev.galleryImages,
        ...toAdd.map((url) => ({ url, favorite: false, size: 'medium' as const })),
      ],
    }));
  }, [formData.content]);

  // Fetch existing series from database
  useEffect(() => {
    async function fetchSeries() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('series')
          .not('series', 'is', null)
          .order('series');

        if (error) throw error;

        // Get unique series names
        const uniqueSeries = Array.from(new Set(
          data?.map(p => p.series).filter(Boolean) || []
        )) as string[];

        setExistingSeries(uniqueSeries);
      } catch (error) {
        console.error('Error fetching series:', error);
      }
    }
    fetchSeries();
  }, []);

  // Calculate word count and reading time
  useEffect(() => {
    const text = formData.content || '';
    const words = text.split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const stats = readingTime(text);
    setReadingTimeMinutes(Math.ceil(stats.minutes));
  }, [formData.content]);

  const handleGalleryUrlAdd = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setGalleryUploadError('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      setGalleryUploadError('Invalid URL format');
      return;
    }

    // Add to gallery
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, { url: trimmedUrl, favorite: false, size: 'medium' as const }],
    }));
    setGalleryUploadError('');
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
    } catch (_error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const buildPayload = () => {
    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // AUTO-FORMAT CONTENT before building payload
    const formattingResult = autoFormatContent(formData.content);
    const formattedContent = formattingResult.formattedContent;

    return {
      slug: post.slug, // Keep existing slug
      slugOverride: formData.slugOverride || null,
      slugLocked: formData.slugLocked,
      title: formData.title,
      description: formData.description || '',
      content: formattedContent, // Use auto-formatted content!
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
      coverImageCrop: formData.coverImageCrop || null,
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
      relatedLinks: formData.relatedLinks || [],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = buildPayload();

      const response = await fetch(`/api/admin/posts/${encodeURIComponent(post.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
        cache: 'no-store',
      });

      let data: { success?: boolean; error?: string };
      try {
        data = await response.json();
      } catch {
        setError(`Server returned invalid response (${response.status})`);
        toast.error('Could not save. Please try again.');
        setLoading(false);
        return;
      }

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Post updated. Changes saved.');
        onSuccess();
      } else {
        const errorMessage = data.error || `Save failed (${response.status})`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
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
    editorRef.current?.insertAtCursor(text);
  };

  const getSizeClass = (size: 'small'|'medium'|'large'|'full' = 'medium') =>
    size === 'full' ? 'full-width' : `size-${size}`;

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
        galleryImages: [...prev.galleryImages, ...uploadedUrls.map(url => ({ url, favorite: false, size: 'medium' as const }))],
      }));
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
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
{/* Quick Insert Links Panel */}
                <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>⚡</span> Quick Insert
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => insertAtCursor('[About](/about)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert About link">📄 About</button>
                    <button type="button" onClick={() => insertAtCursor('[Contact](/contact)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Contact link">📧 Contact</button>
                    <button type="button" onClick={() => insertAtCursor('[Blog](/blog)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Blog link">📝 Blog</button>
                    <button type="button" onClick={() => insertAtCursor('[FAQ](/faq)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert FAQ link">❓ FAQ</button>
                    <button type="button" onClick={() => insertAtCursor('[Resources](/resources)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert Resources link">🔧 Resources</button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button type="button" onClick={() => insertAtCursor('[contact@wiredliving.com](mailto:contact@wiredliving.com)')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert email">✉️ Email</button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button type="button" onClick={() => insertAtCursor('| Column 1 | Column 2 | Column 3 |\\n|----------|----------|----------|\\n| Data 1   | Data 2   | Data 3   |')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert table">📋 Table</button>
                    <button type="button" onClick={() => insertAtCursor('```chart\\ntype: bar\\ndata:\\n  labels: [Q1, Q2, Q3, Q4]\\n  values: [10, 20, 30, 40]\\n```')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert chart">📊 Chart</button>
                    <button type="button" onClick={() => insertAtCursor('> **Note:** Important callout or note.\\n')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert note">💡 Note</button>
                    <button type="button" onClick={() => insertAtCursor('```javascript\\n// Code here\\nconst example = \"Hello World\";\\nconsole.log(example);\\n```')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert code">💻 Code</button>
                    <button type="button" onClick={() => insertAtCursor('---\\n\\n**TL;DR:** Quick summary.\\n\\n---\\n')} className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors" title="Insert TL;DR">⚡ TL;DR</button>
                  </div>
                </div>

                <div className="mt-2">
                  <LiveMarkdownEditor
                    ref={editorRef}
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="# Intro — share the story, insights, or deep dive for this post here..."
                    galleryImages={formData.galleryImages}
                    title={formData.title}
                    onFormat={(formatted) => setFormData({ ...formData, content: formatted })}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    SEO (optional)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      // Use smart SEO generator
                      const seoResult = generateSmartSEO(
                        formData.title || '',
                        formData.description || '',
                        formData.content || '',
                        formData.category
                      );

                      // Validate and show warnings if any
                      const validation = validateSEO(seoResult);
                      if (!validation.valid && validation.warnings.length > 0) {
                        console.log('SEO Suggestions:', validation.warnings);
                      }

                      setFormData({
                        ...formData,
                        seoTitle: seoResult.seoTitle,
                        seoDescription: seoResult.seoDescription,
                        twitterTitle: seoResult.twitterTitle,
                        twitterDescription: seoResult.twitterDescription,
                      });

                      // Show success message
                      toast.success( '✨ Smart SEO generated successfully!');
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Smart SEO
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="md:col-span-2">
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
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" htmlFor="structuredDataTypeEdit">
                      Structured Data Type
                    </label>
                    <select
                      id="structuredDataTypeEdit"
                      value={formData.structuredDataType}
                      onChange={(e) => setFormData({ ...formData, structuredDataType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Structured data type"
                    >
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="Product">Product</option>
                      <option value="Article">Article</option>
                    </select>
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
                  <div className="md:col-span-2">
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
                </div>
              </div>
              {/* Additional images / gallery - Below SEO section */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  📸 Additional images
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload images or add from URL (Giphy, direct links). Click position buttons to insert.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingGallery}
                      onChange={(e) => handleGalleryUpload(e.target.files)}
                      className="block flex-1 text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                      aria-label="Upload gallery images"
                      title="Upload gallery images"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
                      disabled={uploadingGallery}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        showGalleryUrlInput
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                      }`}
                      title="Add image from URL (Giphy, Tenor, direct links)"
                    >
                      🔗 URL
                    </button>
                  </div>
                  {showGalleryUrlInput && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <input
                        type="text"
                        value={galleryUrlValue}
                        onChange={(e) => setGalleryUrlValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGalleryUrlAdd(galleryUrlValue);
                            setGalleryUrlValue('');
                          } else if (e.key === 'Escape') {
                            setShowGalleryUrlInput(false);
                            setGalleryUrlValue('');
                          }
                        }}
                        placeholder="Paste Giphy, Tenor, or direct image URL..."
                        className="flex-1 px-3 py-1.5 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleGalleryUrlAdd(galleryUrlValue);
                          setGalleryUrlValue('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGalleryUrlInput(false);
                          setGalleryUrlValue('');
                        }}
                        className="px-2 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {galleryUploadError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{galleryUploadError}</p>
                  )}
                  {formData.galleryImages.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-auto">
                      {formData.galleryImages.map((img, idx) => {
                        const size = img.size ?? 'medium';
                        const sizeClass = getSizeClass(size);
                        const insertImg = (align: 'center' | 'right' | 'left' | 'full') => {
                          if (align === 'full') {
                            insertAtCursor(`<img src="${img.url}" alt="" class="full-width" />`);
                          } else if (align === 'center') {
                            insertAtCursor(`<img src="${img.url}" alt="" class="${sizeClass}" />`);
                          } else {
                            insertAtCursor(`<img src="${img.url}" alt="" align="${align}" class="${sizeClass}" />`);
                          }
                        };
                        return (
                          <div key={img.url + idx} className="flex flex-col gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-950">
                            <img src={img.url} alt="" className="w-full aspect-video object-cover rounded" />
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">Size</div>
                            <div className="flex flex-wrap gap-0.5">
                              {(['small', 'medium', 'large', 'full'] as const).map((s) => (
                                <button key={s} type="button" onClick={() => setFormData((prev) => { const next = [...prev.galleryImages]; next[idx] = { ...next[idx], size: s }; return { ...prev, galleryImages: next }; })} className={`px-1 py-0.5 rounded text-[9px] ${size === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{s === 'full' ? 'Full' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <button type="button" onClick={() => insertImg('center')} className="px-1 py-1 rounded bg-blue-50 dark:bg-blue-900/40 text-[9px] text-blue-700 dark:text-blue-200">📐 Center</button>
                              <button type="button" onClick={() => insertImg('right')} className="px-1 py-1 rounded bg-green-50 dark:bg-green-900/40 text-[9px] text-green-700 dark:text-green-200">➡️ Right</button>
                              <button type="button" onClick={() => insertImg('left')} className="px-1 py-1 rounded bg-purple-50 dark:bg-purple-900/40 text-[9px] text-purple-700 dark:text-purple-200">⬅️ Left</button>
                              <button type="button" onClick={() => insertImg('full')} className="px-1 py-1 rounded bg-indigo-50 dark:bg-indigo-900/40 text-[9px] text-indigo-700 dark:text-indigo-200">↔️ Full</button>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => copyGalleryImageUrl(img.url)} className="flex-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px]">Copy</button>
                              <button type="button" onClick={() => removeGalleryImage(idx)} className="flex-1 px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-[9px] text-red-600">Remove</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-6">
              {/* Backlinks & Quick Links Generator */}
              <div className="bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-blue-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-blue-900/10 rounded-xl p-1 border border-blue-200/50 dark:border-blue-800/50">
                <BacklinksGenerator
                  postTitle={post.title || 'this post'}
                  postUrl={post.slug ? `/blog/${post.slug}` : '/blog/your-post'}
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Post details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Who wrote this post? Enter your name or the author's name. This appears on the post and helps identify who created the content.">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Melvin Peralta"
                      title="Who wrote this post? Enter your name or the author's name. This appears on the post and helps identify who created the content."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What topic does this post cover? Categories help organize your blog and let readers find similar content (e.g., Technology, Cooking, Travel).">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g. Technology, Tutorial, News"
                      title="What topic does this post cover? Categories help organize your blog and let readers find similar content (e.g., Technology, Cooking, Travel)."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Is this part of a series? If you're writing multiple related posts, give them the same series name to group them together.">
                        Series {existingSeries.length > 0 && <span className="text-gray-400 font-normal">({existingSeries.length} existing)</span>}
                      </label>
                      <select
                        value={formData.series}
                        onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        title="Is this part of a series? If you're writing multiple related posts, give them the same series name to group them together."
                      >
                        <option value="">Select a series...</option>
                        <option value="">───────────</option>
                        {existingSeries.map((series) => (
                          <option key={series} value={series}>
                            {series}
                          </option>
                        ))}
                        <option value="">───────────</option>
                        <option value="[create-new]">+ Create New Series</option>
                      </select>
                      {formData.series === '[create-new]' && (
                        <input
                          type="text"
                          value={formData.series === '[create-new]' ? '' : formData.series}
                          onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                          className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Enter new series name..."
                          autoFocus
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What order should this post appear in the series? Use numbers like 1, 2, 3 to order your posts from first to last.">
                        Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.seriesOrder || ''}
                        onChange={(e) => setFormData({ ...formData, seriesOrder: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="1"
                        title="What order should this post appear in the series? Use numbers like 1, 2, 3 to order your posts from first to last."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="The URL-friendly version of your title. Usually auto-generated, but you can customize it. Use only letters, numbers, and hyphens. Lock it to prevent changes.">
                      Custom Slug
                    </label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        value={formData.slugOverride}
                        onChange={(e) => setFormData({ ...formData, slugOverride: e.target.value })}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={generateSlug(formData.title) || post.slug}
                        title="The URL-friendly version of your title. Usually auto-generated, but you can customize it. Use only letters, numbers, and hyphens."
                      />
                      <label className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 flex-shrink-0" title="Lock the slug to prevent it from changing even if you update the title.">
                        <input
                          type="checkbox"
                          checked={formData.slugLocked}
                          onChange={(e) => setFormData({ ...formData, slugLocked: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Lock</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current slug: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{post.slug}</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Keywords that describe your post. Use comma-separated tags to help readers find your content. Examples: javascript, cooking, travel, tips">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="ai, product, shipping, nextjs"
                      title="Keywords that describe your post. Use comma-separated tags to help readers find your content. Examples: javascript, cooking, travel, tips"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate tags with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="A short preview of your post. Write 1-2 sentences that grab attention and make people want to read more. This appears on your blog's home page and in search results.">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="One or two sentences that hook the reader."
                      title="A short preview of your post. Write 1-2 sentences that grab attention and make people want to read more. This appears on your blog's home page and in search results."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="What's the current state of your post? Draft = not published yet, Scheduled = will publish later, Published = live and visible to everyone.">
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
                      title="What's the current state of your post? Draft = not published yet, Scheduled = will publish later, Published = live and visible to everyone."
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="When should this post go live? Pick a date and time, and the post will automatically publish at that moment.">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        title="When should this post go live? Pick a date and time, and the post will automatically publish at that moment."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="Who can see this post? Public = everyone, Unlisted = only people with the link, Private = only you.">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'unlisted' | 'private' })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      title="Who can see this post? Public = everyone, Unlisted = only people with the link, Private = only you."
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400" title="The main image for your post. Upload a file or paste an image URL. This appears at the top of your post and as a thumbnail on your blog's listing pages.">
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
                          title="Upload an image file from your computer"
                        />
                      </div>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://image.host/your-cover.jpg"
                        title="Or paste an image URL here. The image will appear at the top of your post and as a thumbnail."
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
                          {/* Crop Button */}
                          {formData.featured && (
                            <button
                              type="button"
                              onClick={() => setShowCropModal(true)}
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Crop for Home Page Featured Card
                            </button>
                          )}

                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.coverImage}
                              alt="Cover preview"
                              className="w-full h-32 object-cover cover-object-position"
                            />
                          </div>

                          {formData.featured && formData.coverImageCrop && (
                            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                                ✓ Crop applied: {formData.coverImageCrop.objectPosition}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2" title="Highlight this post as one of your best. Featured posts get special attention and may appear at the top of your blog or in special sections.">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked, coverImageCrop: e.target.checked ? formData.coverImageCrop : undefined })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mark as featured
                      </span>
                    </label>
                    {formData.featured && formData.coverImage && !formData.coverImageCrop && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 ml-6">
                        💡 Tip: Use the crop button above to adjust how this image appears on the home page
                      </p>
                    )}
                  </div>
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
                    title="Preview iframe"
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
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (previewSlug) {
                  const previewUrl = post.published ? `/blog/${previewSlug}` : `/blog/preview/${previewSlug}`;
                  window.open(previewUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="px-6 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Open Preview
            </button>
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

        {/* Crop Modal */}
        {showCropModal && formData.coverImage && (
          <ImageCropModal
            imageUrl={formData.coverImage}
            initialCrop={formData.coverImageCrop}
            onSave={(cropData) => {
              setFormData({ ...formData, coverImageCrop: cropData });
              setShowCropModal(false);
            }}
            onClose={() => setShowCropModal(false)}
          />
        )}
        <style jsx>{`
          .cover-object-position {
            object-position: ${coverObjectPosition};
          }
        `}</style>
      </div>
    </div>
  );
}
