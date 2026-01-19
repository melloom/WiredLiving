'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (Mac)
      // This won't conflict with browser shortcuts
      const isModifierPressed = (event.ctrlKey || event.metaKey) && event.shiftKey;
      const isLKey = event.key === 'l' || event.key === 'L';

      if (isModifierPressed && isLKey) {
        // Prevent default browser behavior
        event.preventDefault();
        // Navigate to login page
        router.push('/login');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return null;
}