'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

interface YoutubeDownloaderProps {
  url: string;
  onDownloadComplete: (mp3Url: string, title: string, artist: string) => void;
}

export function YoutubeDownloader({ url, onDownloadComplete }: YoutubeDownloaderProps) {
  const [isFetching, setIsFetching] = useState(false);
  const toast = useToast();

  const fetchMetadata = async () => {
    setIsFetching(true);

    try {
      const response = await fetch('/api/admin/youtube-to-mp3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metadata');
      }

      // Keep the YouTube URL as src — the sticky player handles it via iframe embed
      onDownloadComplete(url, data.videoInfo.title, data.videoInfo.artist);
      toast.success('YouTube video info loaded! It will play via embedded player.');

    } catch (error) {
      console.error('Metadata fetch error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch video info');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            YouTube Video Detected
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Auto-fill title &amp; artist from YouTube
          </p>
        </div>
        <button
          onClick={fetchMetadata}
          disabled={isFetching}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isFetching ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              Fetch Info
            </>
          )}
        </button>
      </div>
      
      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
        YouTube URLs play via embedded player. No download needed.
      </p>
    </div>
  );
}
