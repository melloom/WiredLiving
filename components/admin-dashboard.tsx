'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface AdminDashboardProps {
  posts: BlogPost[];
}

type TabType = 'overview' | 'posts' | 'analytics' | 'create';

export function AdminDashboard({ posts }: AdminDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentPosts = [...posts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'posts' as TabType, label: 'Posts', icon: '📝' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: '📈' },
    { id: 'create' as TabType, label: 'Create', icon: '➕' },
  ];

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
                        href={`/blog/${post.slug}`}
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
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
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium whitespace-nowrap"
                >
                  ➕ New Post
                </button>
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
                            {post.published ? (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                                Published
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">
                                Draft
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
                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/posts/${post.slug}/edit`}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </Link>
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
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Content Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Words</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.totalWords.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Avg Reading Time</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.avgReadingTime} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Publish Rate</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.totalPosts > 0 
                        ? Math.round((stats.publishedPosts / stats.totalPosts) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Post Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.publishedPosts}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${stats.totalPosts > 0 ? (stats.publishedPosts / stats.totalPosts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Drafts</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.draftPosts}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${stats.totalPosts > 0 ? (stats.draftPosts / stats.totalPosts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Top Tags</h3>
              <div className="flex flex-wrap gap-3">
                {Array.from(new Set(posts.flatMap(p => p.tags)))
                  .map(tag => ({
                    tag,
                    count: posts.filter(p => p.tags.includes(tag)).length,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map(({ tag, count }) => (
                    <div
                      key={tag}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{tag}</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({count})</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Post Tab */}
        {activeTab === 'create' && (
          <CreatePostForm onSuccess={() => {
            setActiveTab('posts');
            router.refresh();
          }} />
        )}
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
    published: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          date: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          content: '',
          author: '',
          tags: '',
          published: false,
        });
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Create New Post</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 font-medium">
            ✓ Post created successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter post title"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Brief description of the post"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="Write your post content here (Markdown supported)"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Author name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate tags with commas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Publish immediately
          </label>
        </div>

        <div className="flex gap-4">
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
                published: false,
              });
              setError('');
            }}
            className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
