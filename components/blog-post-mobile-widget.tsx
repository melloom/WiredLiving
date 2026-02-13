'use client';

import { useMobileMenu } from '@/lib/mobile-menu-context';
import { MobileWidgetBar } from '@/components/mobile-widget-bar';

interface BlogPostMobileWidgetProps {
  postContent?: string;
  galleryImages?: string[];
  newsKeywords?: string;
  showQuickLinks?: boolean;
  showTableOfContents?: boolean;
  showRelatedNews?: boolean;
  showGallery?: boolean;
  showWeather?: boolean;
  showContact?: boolean;
  sidebarMusicPlayer?: { enabled: boolean; src: string; title?: string; artist?: string };
}

export function BlogPostMobileWidget({
  postContent,
  galleryImages,
  newsKeywords,
  showQuickLinks,
  showTableOfContents,
  showRelatedNews,
  showGallery,
  showWeather,
  showContact,
  sidebarMusicPlayer,
}: BlogPostMobileWidgetProps) {
  const { isOpen: mobileMenuOpen } = useMobileMenu();

  return (
    <MobileWidgetBar
      postContent={postContent}
      galleryImages={galleryImages}
      newsKeywords={newsKeywords}
      showQuickLinks={showQuickLinks}
      showTableOfContents={showTableOfContents}
      showRelatedNews={showRelatedNews}
      showGallery={showGallery}
      showWeather={showWeather}
      showContact={showContact}
      sidebarMusicPlayer={sidebarMusicPlayer}
      mobileMenuOpen={mobileMenuOpen}
    />
  );
}
