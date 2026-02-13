'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarWeather } from './sidebar-weather';
import { SidebarContact } from './sidebar-contact';
import { SidebarGallery } from './sidebar-gallery';
import { SidebarClock } from './sidebar-clock';

import { NewsFeed } from './news-feed';
import { ContentQuickLinks } from './content-quick-links';
import { TableOfContents } from './table-of-contents';

interface MobileWidgetBarProps {
  postContent?: string;
  postTitle?: string;
  galleryImages?: string[];
  newsKeywords?: string;
  showQuickLinks?: boolean;
  showTableOfContents?: boolean;
  showRelatedNews?: boolean;
  showGallery?: boolean;
  showWeather?: boolean;
  showContact?: boolean;
  sidebarMusicPlayer?: { enabled: boolean; src: string; title?: string; artist?: string };
  mobileMenuOpen?: boolean;
  onClose?: () => void;
}

export function MobileWidgetBar({
  postContent = '',
  galleryImages = [],
  newsKeywords = '',
  showQuickLinks = true,
  showTableOfContents = true,
  showRelatedNews = true,
  showGallery = true,
  showWeather = true,
  showContact = true,
  sidebarMusicPlayer,
  mobileMenuOpen = false,
  onClose,
}: MobileWidgetBarProps) {
  const [openWidget, setOpenWidget] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openWidget) {
        setOpenWidget(null);
      }
    };

    if (openWidget) {
      document.addEventListener('keydown', handleEscape);
      // Focus close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openWidget]);

  const widgets: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    show: boolean | string | undefined;
    content: React.ReactNode | null;
    onTap?: () => void;
  }> = [
    {
      id: 'quicklinks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Quick Links',
      show: showQuickLinks && postContent,
      content: postContent ? <ContentQuickLinks content={postContent} onLinkClick={() => setOpenWidget(null)} /> : null,
    },
    {
      id: 'toc',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      label: 'Contents',
      show: !!postContent,
      content: postContent ? <TableOfContents content={postContent} onLinkClick={() => setOpenWidget(null)} /> : null,
    },
    {
      id: 'news',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: 'News',
      show: showRelatedNews,
      content: <NewsFeed keywords={newsKeywords} limit={5} />,
    },
    {
      id: 'gallery',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Gallery',
      show: showGallery && galleryImages.length > 0,
      content: galleryImages.length > 0 ? <SidebarGallery images={galleryImages} /> : null,
    },
    {
      id: 'weather',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      label: 'Weather',
      show: showWeather,
      content: <SidebarWeather />,
    },
    {
      id: 'clock',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Clock',
      show: true,
      content: <SidebarClock />,
    },
    {
      id: 'music',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      label: 'Music',
      show: !!(sidebarMusicPlayer?.enabled && sidebarMusicPlayer?.src),
      // No modal content — tapping this icon toggles the sticky player directly
      content: null,
      onTap: () => {
        const toggle = (window as unknown as Record<string, unknown>).__toggleStickyMusicPlayer;
        if (typeof toggle === 'function') toggle();
      },
    },
    {
      id: 'contact',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Contact',
      show: showContact,
      content: <SidebarContact />,
    },
  ].filter(w => w.show);

  const currentWidget = widgets.find(w => w.id === openWidget);

  return (
    <>
      {/* Mobile Widget Bar - Sticky bottom bar - hidden when menu is open */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-2xl safe-bottom">
          <div className="flex items-stretch gap-2 px-2 py-3 max-w-7xl mx-auto">
            {widgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => {
                  if (widget.onTap) {
                    widget.onTap();
                    setOpenWidget(null);
                  } else {
                    setOpenWidget(openWidget === widget.id ? null : widget.id);
                  }
                }}
                className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-center ${
                  openWidget === widget.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label={widget.label}
              >
                {widget.icon}
                <span className="text-[10px] font-medium">{widget.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Widget Modal/Popup */}
      {!mobileMenuOpen && openWidget && currentWidget && (
        <>
          {/* Backdrop - clickable */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setOpenWidget(null)}
            aria-label="Close widget"
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden safe-bottom animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`widget-title-${currentWidget.id}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 
                id={`widget-title-${currentWidget.id}`}
                className="text-lg font-bold text-gray-900 dark:text-gray-100"
              >
                {currentWidget.label}
              </h3>
              <button
                ref={closeButtonRef}
                onClick={() => setOpenWidget(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Close ${currentWidget.label}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-64px)] p-4">
              {currentWidget.content}
            </div>
          </div>
        </>
      )}
    </>
  );
}
