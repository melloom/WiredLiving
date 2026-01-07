'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+L (Windows/Linux) or Cmd+L (Mac)
      const isModifierPressed = event.ctrlKey || event.metaKey;
      const isLKey = event.key === 'l' || event.key === 'L';

      if (isModifierPressed && isLKey) {
        // Prevent default browser behavior (location bar focus)
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

