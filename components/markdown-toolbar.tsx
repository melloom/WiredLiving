'use client';

interface MarkdownToolbarProps {
  onInsert: (text: string) => void;
  onInsertImage?: () => void;
  galleryImages?: Array<{ url: string; favorite: boolean }>;
}

export function MarkdownToolbar({ onInsert, onInsertImage, galleryImages }: MarkdownToolbarProps) {
  const insertHeading = (level: 1 | 2 | 3 | 4) => {
    const prefix = '#'.repeat(level);
    onInsert(`\n${prefix} Heading ${level}\n`);
  };

  const insertCodeBlock = () => {
    onInsert('\n```\n// Your code here\n```\n');
  };

  const insertInlineCode = () => {
    onInsert('`code`');
  };

  const insertBold = () => {
    onInsert('**bold text**');
  };

  const insertItalic = () => {
    onInsert('*italic text*');
  };

  const insertLink = () => {
    onInsert('[link text](https://example.com)');
  };

  const insertImage = () => {
    if (onInsertImage) {
      onInsertImage();
    } else {
      onInsert('![alt text](https://example.com/image.jpg)');
    }
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      onInsert('\n1. First item\n2. Second item\n3. Third item\n');
    } else {
      onInsert('\n- First item\n- Second item\n- Third item\n');
    }
  };

  const insertTable = () => {
    onInsert('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
  };

  const insertBlockquote = () => {
    onInsert('\n> This is a blockquote\n> It can span multiple lines\n');
  };

  const insertDivider = () => {
    onInsert('\n---\n');
  };

  const insertChecklist = () => {
    onInsert('\n- [ ] Task 1\n- [ ] Task 2\n- [x] Completed task\n');
  };

  const insertCallout = (type: 'info' | 'warning' | 'success' | 'error') => {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };
    onInsert(`\n> ${emojis[type]} **${type.charAt(0).toUpperCase() + type.slice(1)}**\n> Your message here\n`);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertBold}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertItalic}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertInlineCode}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Inline code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => insertHeading(1)}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertHeading(2)}
            className="px-2 py-1 rounded text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => insertList(false)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Unordered list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertList(true)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Ordered list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertChecklist}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Checklist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Insert image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Code */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Code block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* Special Blocks */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={insertBlockquote}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Blockquote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertDivider}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Horizontal divider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Callouts */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Callouts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                type="button"
                onClick={() => insertCallout('info')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>ℹ️</span> Info
              </button>
              <button
                type="button"
                onClick={() => insertCallout('warning')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>⚠️</span> Warning
              </button>
              <button
                type="button"
                onClick={() => insertCallout('success')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>✅</span> Success
              </button>
              <button
                type="button"
                onClick={() => insertCallout('error')}
                className="w-full px-3 py-1.5 text-left text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>❌</span> Error
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Quick Insert */}
        {galleryImages && galleryImages.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-gray-300 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Gallery:</span>
            <div className="flex gap-1 flex-wrap">
              {galleryImages.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onInsert(`![](${img.url})`)}
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-700 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  title={`Insert ${img.url}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {galleryImages.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                  +{galleryImages.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

