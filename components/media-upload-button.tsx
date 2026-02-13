'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useToast } from '@/components/toast';

interface MediaUploadButtonProps {
  onInsert: (markdown: string) => void;
  postSlug?: string;
  type?: 'video' | 'image' | 'gif';
}

export function MediaUploadButton({ onInsert, postSlug, type = 'video' }: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (type === 'gif' && file.type !== 'image/gif') {
      toast.error('Please select a GIF file');
      return;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 100MB');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', 'medium'); // Default quality
      formData.append('autoCompress', type === 'video' ? 'true' : 'false');
      if (postSlug) {
        formData.append('postSlug', postSlug);
      }

      setProgress(30);

      const isVideo = type === 'video';
      const isGif = type === 'gif';
      
      // For GIFs, use the conversion endpoint
      const endpoint = isGif ? '/api/admin/convert-gif' : '/api/admin/upload-media';
      
      const uploadMessage = isVideo 
        ? `Uploading and compressing ${file.name}... This may take a minute.`
        : isGif
        ? `Converting ${file.name} to MP4 for better performance... This may take a moment.`
        : `Uploading ${file.name}...`;
      
      toast.info(uploadMessage);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);

      // Insert markdown into editor
      if (data.markdown) {
        onInsert(data.markdown);
      }

      // Show success message
      if (isVideo && data.compressionRatio) {
        toast.success(`Video uploaded and compressed! Saved ${data.compressionRatio}% storage 🎉`);
      } else if (isGif && data.compressionRatio) {
        toast.success(`GIF converted to MP4! ${data.compressionRatio}% smaller file with same animation 🚀`);
      } else {
        toast.success('File uploaded successfully!');
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlInsert = () => {
    const trimmedUrl = urlValue.trim();
    if (!trimmedUrl) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    // Check if URL is from a supported media host
    const isGiphy = trimmedUrl.includes('giphy.com');
    const isTenor = trimmedUrl.includes('tenor.com');
    const isImgur = trimmedUrl.includes('imgur.com');
    const isDirectMedia = /\.(gif|jpg|jpeg|png|webp|mp4|webm|mov)$/i.test(trimmedUrl.split('?')[0]);

    if (!isGiphy && !isTenor && !isImgur && !isDirectMedia) {
      const confirm = window.confirm(
        'This URL might not be a direct media link. Insert anyway?'
      );
      if (!confirm) return;
    }

    // Convert Giphy/Tenor URLs to direct media URLs
    let finalUrl = trimmedUrl;
    
    // Giphy: Extract media URL from various formats
    if (isGiphy) {
      // If it's already a media.giphy.com URL, use as-is
      if (trimmedUrl.includes('media.giphy.com') || trimmedUrl.includes('i.giphy.com')) {
        finalUrl = trimmedUrl;
      } else {
        // Try to extract GIF ID from giphy.com/gifs/... URL
        const giphyIdMatch = trimmedUrl.match(/gifs\/(?:[^-]*-)?([a-zA-Z0-9]+)$/);
        if (giphyIdMatch) {
          const gifId = giphyIdMatch[1];
          finalUrl = `https://media.giphy.com/media/${gifId}/giphy.gif`;
        } else {
          toast.warning('Could not convert Giphy URL. Please use the embed URL from Giphy (right-click > Copy Image Address)');
        }
      }
    }
    
    // Tenor: Convert to direct media URL
    if (isTenor && !trimmedUrl.includes('media.tenor.com')) {
      toast.warning('Please use the direct GIF URL from Tenor (right-click on GIF > Copy Image Address)');
    }

    // Generate appropriate markdown based on type
    let markdown = '';
    const altText = type === 'gif' ? 'GIF' : type === 'video' ? 'Video' : 'Image';
    
    if (type === 'video' || trimmedUrl.match(/\.(mp4|webm|mov)$/i)) {
      markdown = `<video controls src="${finalUrl}" class="w-full rounded-lg"></video>`;
    } else if (type === 'gif' || isGiphy || isTenor || trimmedUrl.match(/\.gif$/i)) {
      markdown = `![${altText}](${finalUrl})`;
    } else {
      markdown = `![${altText}](${finalUrl})`;
    }

    onInsert(markdown);
    setUrlValue('');
    setShowUrlInput(false);
    toast.success(`${type === 'video' ? 'Video' : type === 'gif' ? 'GIF' : 'Image'} URL inserted!`);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonLabel = () => {
    if (uploading) {
      if (type === 'video') {
        return `Compressing... ${progress}%`;
      }
      if (type === 'gif') {
        return `Converting... ${progress}%`;
      }
      return `Uploading... ${progress}%`;
    }
    return type === 'video' ? 'Upload Video' : type === 'gif' ? 'Upload GIF' : 'Upload Image';
  };

  const getAcceptTypes = () => {
    if (type === 'video') return 'video/*';
    if (type === 'gif') return 'image/gif';
    return 'image/*';
  };

  const getIcon = () => {
    if (type === 'video') return '📹';
    if (type === 'gif') return '🎬';
    return '📷';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
        aria-label={type === 'video' ? 'Upload video file' : type === 'gif' ? 'Upload GIF file' : 'Upload image file'}
        title={type === 'video' ? 'Select a video file to upload' : type === 'gif' ? 'Select a GIF file to upload' : 'Select an image file to upload'}
      />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${uploading 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
              }
              flex items-center gap-2
            `}
            title={type === 'video' ? 'Upload video - Will automatically compress to save storage!' : type === 'gif' ? 'Upload GIF - Will convert to MP4 for better performance!' : 'Upload file'}
          >
            <span className="text-lg">{getIcon()}</span>
            <span>{getButtonLabel()}</span>
            {uploading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={uploading}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${uploading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : showUrlInput
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  : 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm hover:shadow-md'
              }
              flex items-center gap-2
            `}
            title={`Insert ${type} from URL (Giphy, Tenor, etc.)`}
          >
            <span className="text-lg">🔗</span>
            <span>From URL</span>
          </button>
        </div>

        {showUrlInput && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlInsert();
                } else if (e.key === 'Escape') {
                  setShowUrlInput(false);
                  setUrlValue('');
                }
              }}
              placeholder={`Paste ${type === 'gif' ? 'Giphy/Tenor' : type} URL here...`}
              className="flex-1 px-3 py-2 text-sm rounded border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={handleUrlInsert}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlValue('');
              }}
              className="px-3 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {uploading && (type === 'video' || type === 'gif') && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 progress-inner"></div>
            <style jsx>{`
              .progress-inner { width: ${progress}% }
            `}</style>
          </div>
        )}

        {showUrlInput && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
            💡 Supports Giphy, Tenor, Imgur, and direct media URLs
          </div>
        )}
      </div>
    </>
  );
}
