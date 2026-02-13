'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

interface YoutubeDownloaderProps {
  url: string;
  onDownloadComplete: (mp3Url: string, title: string, artist: string) => void;
}

export function YoutubeDownloader({ url, onDownloadComplete }: YoutubeDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const toast = useToast();

  const downloadMP3 = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Extract video ID
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (!match) {
        throw new Error('Invalid YouTube URL');
      }

      const videoId = match[1];
      
      // Use our API endpoint to handle the download
      const response = await fetch('/api/admin/youtube-to-mp3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Download failed');
      }

      // Handle the download result
      if (data.mp3Url) {
        onDownloadComplete(data.mp3Url, data.videoInfo.title, data.videoInfo.artist);
        toast.success('MP3 downloaded and ready to play!');
      } else {
        toast.success(data.message || 'Processing YouTube video...');
      }

    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            🎵 YouTube Video Detected
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
            Convert to MP3 for better playback
          </p>
        </div>
        <button
          onClick={downloadMP3}
          disabled={isDownloading}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {downloadProgress}%
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Download MP3
            </>
          )}
        </button>
      </div>
      
      {isDownloading && (
        <div className="mt-2">
          <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
        Note: Downloads and compresses to 64kbps MP3 (max 4 min) to save storage space.
      </p>
    </div>
  );
}
