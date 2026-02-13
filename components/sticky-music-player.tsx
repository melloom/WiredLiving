'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface StickyMusicPlayerProps {
  musicPlayer: {
    enabled: boolean;
    src: string;
    title?: string;
    artist?: string;
  } | null;
}

export function StickyMusicPlayer({ musicPlayer }: StickyMusicPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showYouTubeIframe, setShowYouTubeIframe] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (musicPlayer?.enabled && musicPlayer.src) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsPlaying(false);
      setShowYouTubeIframe(false);
    }
  }, [musicPlayer]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Extract YouTube video ID for thumbnail and embed URL
  const getYouTubeInfo = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!match) return { videoId: null, thumbnail: null };

    const videoId = match[1];
    return {
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };
  };

  const youtubeInfo = musicPlayer ? getYouTubeInfo(musicPlayer.src) : { videoId: null, thumbnail: null };
  const thumbnail = youtubeInfo.thumbnail;
  const isYouTube = youtubeInfo.videoId !== null;

  const togglePlay = async () => {
    // For YouTube URLs, expand the player and show the iframe
    if (isYouTube) {
      if (!showYouTubeIframe) {
        setShowYouTubeIframe(true);
        setIsExpanded(true);
        setIsPlaying(true);
      } else {
        // Toggle expanded to show/hide the iframe
        setIsExpanded(!isExpanded);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        // Ensure audio is loaded
        if (audio.readyState < 2) {
          await new Promise((resolve, reject) => {
            const onLoad = () => {
              audio.removeEventListener('loadeddata', onLoad);
              audio.removeEventListener('error', onError);
              resolve(void 0);
            };
            const onError = (e: any) => {
              audio.removeEventListener('loadeddata', onLoad);
              audio.removeEventListener('error', onError);
              reject(e);
            };
            audio.addEventListener('loadeddata', onLoad);
            audio.addEventListener('error', onError);
          });
        }

        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Audio play error:', error);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            alert('Please click again to enable audio playback. Browsers require user interaction.');
          } else if (error.name === 'NotSupportedError') {
            alert('This audio format is not supported.');
          } else {
            alert(`Error playing audio: ${error.message}`);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible || !musicPlayer) return null;

  // Build YouTube embed URL: autoplay=1 on first open, rel=0 to prevent related videos
  const youtubeEmbedUrl = youtubeInfo.videoId
    ? `https://www.youtube.com/embed/${youtubeInfo.videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1`
    : null;

  return (
    <>
      {!isYouTube && (
        <audio
          ref={audioRef}
          src={musicPlayer.src}
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={(e) => {
            console.error('Audio error:', e);
            setIsLoading(false);
          }}
        />
      )}

      <div
        className={`fixed bg-gradient-to-r from-gray-900 via-purple-900/90 to-gray-900 backdrop-blur-xl border border-purple-500/20 shadow-2xl rounded-2xl transition-all duration-500 ease-in-out z-50 overflow-hidden hidden lg:block lg:bottom-4 lg:right-4 ${isExpanded ? 'lg:w-96' : 'lg:w-80'}`}
        style={{
          maxWidth: 'calc(100vw - 1rem)',
        }}
      >
        {/* Collapsed / Top bar — always visible */}
        <div className="p-3 flex items-center justify-between gap-3">
          {/* Album Art and Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt="Album art"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-white/80 animate-pulse"></div>
                    <div className="w-0.5 h-4 bg-white/80 animate-pulse" style={{ animationDelay: '75ms' }}></div>
                    <div className="w-0.5 h-3.5 bg-white/80 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-white font-semibold text-xs truncate">
                {musicPlayer.title || 'Unknown Title'}
              </h4>
              <p className="text-gray-400 text-[11px] truncate">
                {musicPlayer.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Expand / Collapse */}
            <button
              onClick={handleToggleExpand}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                )}
              </svg>
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-full p-2 shadow-lg transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isYouTube ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume (non-YouTube only) */}
            {!isYouTube && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => {
                setIsVisible(false);
                setShowYouTubeIframe(false);
                setIsExpanded(false);
              }}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded section */}
        <div
          className="transition-all duration-500 ease-in-out overflow-hidden"
          style={{
            maxHeight: isExpanded ? '320px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {/* YouTube iframe — shown inside the expanded area */}
          {isYouTube && showYouTubeIframe && youtubeEmbedUrl && (
            <div className="px-3 pb-2">
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={youtubeEmbedUrl}
                  title={musicPlayer.title || 'YouTube Video'}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            </div>
          )}

          {/* Audio progress bar — non-YouTube only */}
          {!isYouTube && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 tabular-nums">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: duration
                      ? `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                      : '#374151',
                  }}
                />
                <span className="text-[10px] text-gray-400 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #9333ea;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #9333ea;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
}
