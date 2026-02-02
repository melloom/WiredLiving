'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has permanently dismissed or installed
    const permanentlyDismissed = localStorage.getItem('pwa-install-never');
    const installedAt = localStorage.getItem('pwa-installed');
    
    // If permanently dismissed, never show
    if (permanentlyDismissed === 'true') {
      return;
    }
    
    // If already installed, never show
    if (installedAt) {
      return;
    }

    // Check if user has temporarily dismissed
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const parsedDismissed = parseInt(dismissedAt, 10);
      if (!isNaN(parsedDismissed)) {
        const monthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        const timeSinceDismissed = Date.now() - parsedDismissed;
        
        if (timeSinceDismissed < monthInMs) {
          // Still in cooldown period
          return;
        }
      }
    }

    // Listen for the install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Wait 15 seconds after page load before showing
      setTimeout(() => {
        setShowPrompt(true);
      }, 15000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (standalone display mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      localStorage.setItem('pwa-installed', Date.now().toString());
      return;
    }

    // Also check for iOS standalone mode
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      localStorage.setItem('pwa-installed', Date.now().toString());
      return;
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // Mark as installed - never show again
      localStorage.setItem('pwa-installed', Date.now().toString());
      // Clean up any dismissal flags
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-never');
    } else {
      // User dismissed the browser prompt - treat as "Later"
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // User clicked "Later" - don't show again for 30 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleNever = () => {
    // User clicked "No Thanks" - permanently dismiss
    localStorage.setItem('pwa-install-never', 'true');
    // Clean up temporary dismissal
    localStorage.removeItem('pwa-install-dismissed');
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-10 h-10 text-sky-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Install WiredLiving
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Install our app for a faster experience and offline access
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Later
              </button>
              <button
                onClick={handleNever}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors focus:outline-none"
              >
                No Thanks
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
