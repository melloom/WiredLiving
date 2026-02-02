'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

interface BacklinksGeneratorProps {
  postTitle?: string;
  postUrl?: string;
}

interface CustomLink {
  title: string;
  url: string;
  description?: string;
}

export function BacklinksGenerator({ postTitle = 'this post', postUrl = '/blog/your-post' }: BacklinksGeneratorProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'full' | 'references' | 'custom'>('simple');
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState<CustomLink>({ title: '', url: '', description: '' });

  const addCustomLink = () => {
    if (newLink.title && newLink.url) {
      setCustomLinks([...customLinks, newLink]);
      setNewLink({ title: '', url: '', description: '' });
      setShowAddLink(false);
      setSelectedTemplate('custom');
    }
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const generateCustomTemplate = () => {
    if (customLinks.length === 0) {
      return '<!-- Add custom links below -->\n\nNo custom links added yet. Click "Add Link" to create your backlinks section.';
    }

    return `---

### Related & Backlinks

**Custom Links:**
${customLinks.map(link => 
  link.description 
    ? `- [${link.title}](${link.url}) - ${link.description}`
    : `- [${link.title}](${link.url})`
).join('\n')}

**Share this post:**
- Link to this page: \`${postUrl}\`
- Reference: \`[${postTitle}](${postUrl})\`

---`;
  };

  const templates = {
    simple: `[${postTitle}](${postUrl})`,
    
    full: `---

### Related & Backlinks

**Internal Links:**
- [Home](/) - Return to homepage
- [All Blog Posts](/blog) - Browse all articles
- [Categories](/categories) - Explore by topic
- [Tags](/tags) - Find related content
- [Search](/search) - Find specific topics

**Share this post:**
- Link to this page: \`${postUrl}\`
- Reference: \`[${postTitle}](${postUrl})\`

---`,
    
    references: `<!-- Copy & paste these into your content -->

As mentioned in [${postTitle}](${postUrl})...

For more details, see [${postTitle}](${postUrl}).

Related: [${postTitle}](${postUrl})

Check out [${postTitle}](${postUrl}) for the full story.`,
    
    custom: generateCustomTemplate(),
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const quickLinks = {
    contact: `💬 **Thanks for reading!** [Contact me](/contact) if you have questions or feedback.`,
    blog: `📚 **Want more?** [Explore all posts](/blog) for more insights.`,
    newsletter: `📬 **Stay updated!** [Subscribe to the newsletter](/newsletter) for the latest articles.`,
    about: `👋 **Learn more** [About me](/about) and what I do.`,
    full: `---

### Thanks for Reading!

- 💬 [Contact me](/contact) for questions or feedback
- 📚 [Explore more posts](/blog) for additional insights
- 📬 [Subscribe to the newsletter](/newsletter) to stay updated
- 👋 [Learn more about me](/about)

---`,
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        🔗 Backlinks & Quick Links Generator
      </h3>

      {/* Backlinks Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Backlinks Templates</h4>
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            className="px-3 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Link
          </button>
        </div>

        {/* Add Link Form */}
        {showAddLink && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
            <input
              type="text"
              placeholder="Link title (e.g., 'Getting Started')"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="URL (e.g., '/blog/getting-started')"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newLink.description}
              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomLink}
                disabled={!newLink.title || !newLink.url}
                className="flex-1 px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to List
              </button>
              <button
                onClick={() => {
                  setShowAddLink(false);
                  setNewLink({ title: '', url: '', description: '' });
                }}
                className="px-3 py-2 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Custom Links List */}
        {customLinks.length > 0 && (
          <div className="mb-3 space-y-2">
            {customLinks.map((link, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex-1 text-xs">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{link.title}</div>
                  <div className="text-gray-600 dark:text-gray-400 truncate">{link.url}</div>
                  {link.description && (
                    <div className="text-gray-500 dark:text-gray-500 text-[10px] mt-0.5">{link.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeCustomLink(index)}
                  className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  title="Remove link"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSelectedTemplate('simple')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              selectedTemplate === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Simple Link
          </button>
          <button
            onClick={() => setSelectedTemplate('full')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              selectedTemplate === 'full'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Full Section
          </button>
          <button
            onClick={() => setSelectedTemplate('references')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              selectedTemplate === 'references'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            References
          </button>
          {customLinks.length > 0 && (
            <button
              onClick={() => setSelectedTemplate('custom')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                selectedTemplate === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Custom ({customLinks.length})
            </button>
          )}
        </div>

        <div className="relative">
          <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
            {templates[selectedTemplate]}
          </pre>
          <button
            onClick={() => copyToClipboard(templates[selectedTemplate])}
            className="absolute top-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Quick Links Section */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quick Page Links</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(quickLinks).map(([key, value]) => (
            <button
              key={key}
              onClick={() => copyToClipboard(value)}
              className="px-3 py-2 text-left text-xs bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace('-', ' ')}</span>
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
        <p><strong>💡 Tip:</strong> {customLinks.length > 0 ? 'Add custom links and generate a personalized backlinks section!' : 'Click any template to copy it, or add custom links for a personalized section!'}</p>
      </div>
    </div>
  );
}
