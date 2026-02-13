'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, Share2, MoreVertical } from 'lucide-react';

interface MusicPlayerProps {
  src: string;
  className?: string;
  title?: string;
  artist?: string;
}

export function MusicPlayer({ 
  src, 
  className = '',
  title: initialTitle,
  artist: initialArtist
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [title, setTitle] = useState(initialTitle || 'Loading...');
  const [artist, setArtist] = useState(initialArtist || '');
  const [thumbnail, setThumbnail] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if it's a YouTube URL
  const isYouTube = src.includes('youtube.com/watch?v=') || src.includes('youtu.be/');
  const videoId = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];

  useEffect(() => {
    if (isYouTube && videoId && !initialTitle) {
      // Fetch YouTube video info
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then(res => res.json())
        .then(data => {
          setTitle(data.title || 'YouTube Video');
          setArtist(data.author_name || '');
          setThumbnail(data.thumbnail_url || '');
        })
        .catch(() => {
          setTitle('YouTube Video');
        });
    } else if (!isYouTube && !initialTitle) {
      // For direct audio files, try to extract title from URL
      const urlParts = src.split('/');
      const filename = urlParts[urlParts.length - 1];
      setTitle(filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '') || 'Audio Track');
    }
  }, [src, isYouTube, videoId, initialTitle, initialArtist]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isYouTube) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [isYouTube]);

  if (isYouTube) {
    return (
      <div className={`bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-xl shadow-2xl p-4 my-6 ${className}`}>
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center gap-4'}`}>
          {/* Left - Thumbnail */}
          <div className={`relative ${isMobile ? 'w-full flex justify-center' : 'flex-shrink-0'}`}>
            <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-20 h-20'}`}>
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full rounded-lg object-cover shadow-lg"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Center - Info and Progress */}
          <div className={`flex-1 ${isMobile ? 'text-center' : 'min-w-0'}`}>
            <div className="mb-3">
              <h3 className="text-white font-semibold truncate text-sm md:text-base">{title}</h3>
              {artist && <p className="text-gray-300 text-sm truncate">{artist}</p>}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <input
                ref={progressBarRef}
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                <span className="text-xs text-gray-400">{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Right - Controls */}
          <div className={`flex items-center ${isMobile ? 'justify-center gap-4' : 'gap-3'}`}>
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 md:w-12 md:h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
              )}
            </button>

            {/* Extra Controls */}
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-white transition-colors p-2">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors p-2">
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {showMore && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl py-2 min-w-[150px] z-10">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      Download
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      Add to Playlist
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      Share
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-xl shadow-2xl p-4 my-6 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center gap-4'}`}>
        {/* Left - Album Cover */}
        <div className={`relative ${isMobile ? 'w-full flex justify-center' : 'flex-shrink-0'}`}>
          <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-20 h-20'}`}>
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
                  <div className="w-1 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-1 h-7 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Track Info and Progress */}
        <div className={`flex-1 ${isMobile ? 'text-center' : 'min-w-0'}`}>
          {/* Track Info */}
          <div className="mb-3">
            <h3 className="text-white font-semibold truncate text-sm md:text-base">{title}</h3>
            {artist && <p className="text-gray-300 text-sm truncate">{artist}</p>}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <input
              ref={progressBarRef}
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
              <span className="text-xs text-gray-400">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Right - Controls */}
        <div className={`flex items-center ${isMobile ? 'justify-center gap-4' : 'gap-3'}`}>
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="relative">
            <button
              onClick={toggleMute}
              onMouseEnter={() => !isMobile && setShowVolume(true)}
              onMouseLeave={() => !isMobile && setShowVolume(false)}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            
            {/* Volume Slider - Shows on hover for desktop, always for mobile */}
            <div className={`${isMobile ? 'absolute right-0 top-full mt-2 opacity-100 visible' : `absolute right-0 top-full mt-2 transition-opacity ${showVolume ? 'opacity-100 visible' : 'opacity-0 invisible'}`} bg-gray-800 rounded-lg p-3 shadow-xl`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 accent-purple-500"
              />
            </div>
          </div>

          {/* Extra Controls */}
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-white transition-colors p-2">
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors p-2">
              <Share2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showMore && (
                <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl py-2 min-w-[150px] z-10">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Download
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Add to Playlist
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}