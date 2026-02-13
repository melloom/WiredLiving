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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (musicPlayer?.enabled && musicPlayer.src) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsPlaying(false);
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

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
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
        // Show user-friendly error
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            alert('Please click again to enable audio playback. Browsers require user interaction.');
          } else if (error.name === 'NotSupportedError') {
            alert('This audio format is not supported.');
          } else {
            alert(`Error playing audio: ${error.message}`);
          }
        }
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

  if (!isVisible || !musicPlayer) return null;

  // Extract YouTube video ID for thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  const thumbnail = getYouTubeThumbnail(musicPlayer.src);

  return (
    <>
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
      
      <div
        className={`fixed bottom-4 right-4 bg-gradient-to-r from-gray-900 via-purple-900/90 to-gray-900 backdrop-blur-xl border border-purple-500/20 shadow-2xl rounded-2xl transition-all duration-500 z-50 max-w-md ${
          isExpanded ? 'w-96 h-32' : 'w-80 h-20'
        }`}
      >
        <div className="p-4 h-full flex items-center justify-between gap-3">
          {/* Album Art and Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-lg">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt="Album art"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-white/80 animate-pulse"></div>
                    <div className="w-1 h-6 bg-white/80 animate-pulse delay-75"></div>
                    <div className="w-1 h-5 bg-white/80 animate-pulse delay-150"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden sm:block">
              <h4 className="text-white font-semibold text-sm truncate max-w-[200px]">
                {musicPlayer.title || 'Unknown Title'}
              </h4>
              <p className="text-gray-300 text-xs truncate max-w-[200px]">
                {musicPlayer.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Progress Bar - Visible when expanded */}
          {isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/20 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                  }}
                />
                <span className="text-xs text-gray-300">{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-300 hover:text-white transition-colors p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                )}
              </svg>
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-300 hover:text-white transition-colors p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

        @keyframes delay-75 {
          0%, 66% { opacity: 0; }
          66.1%, 100% { opacity: 1; }
        }
        
        @keyframes delay-150 {
          0%, 33% { opacity: 0; }
          33.1%, 100% { opacity: 1; }
        }
        
        .delay-75 {
          animation: delay-75 1s infinite;
        }
        
        .delay-150 {
          animation: delay-150 1s infinite;
        }
      `}</style>
    </>
  );
}
