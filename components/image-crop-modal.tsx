'use client';

import { useState, useRef, useEffect } from 'react';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  rotation: number;
  aspectRatio?: string;
  objectPosition: string;
}

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (cropData: CropData) => void;
  onClose: () => void;
  initialCrop?: Partial<CropData>;
}

export function ImageCropModal({ imageUrl, onSave, onClose, initialCrop }: ImageCropModalProps) {
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [showFullImage, setShowFullImage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const crosshairHRef = useRef<HTMLDivElement>(null);
  const crosshairVRef = useRef<HTMLDivElement>(null);
  const previewRef1 = useRef<HTMLImageElement>(null);
  const previewRef2 = useRef<HTMLImageElement>(null);
  const previewRef3 = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, aspectRatio: '' });

  // Parse initial position on mount
  useEffect(() => {
    if (initialCrop?.objectPosition) {
      const parts = initialCrop.objectPosition.split(' ');
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x)) setPosX(Math.round(x));
        if (!isNaN(y)) setPosY(Math.round(y));
      }
    }
    if (initialCrop?.zoom) {
      setZoom(initialCrop.zoom);
    }
  }, []);

  // Load image to get dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      let aspectLabel = '';
      if (ratio > 1.7) aspectLabel = 'Ultra Wide';
      else if (ratio > 1.4) aspectLabel = 'Wide (16:9)';
      else if (ratio > 1.2) aspectLabel = 'Landscape (4:3)';
      else if (ratio > 0.9) aspectLabel = 'Square (1:1)';
      else if (ratio > 0.6) aspectLabel = 'Portrait (3:4)';
      else aspectLabel = 'Tall (9:16)';

      setImageDimensions({
        width: img.width,
        height: img.height,
        aspectRatio: aspectLabel
      });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const objectPosition = `${posX}% ${posY}%`;

  // Update image and marker positions using refs (avoids inline styles ESLint error)
  useEffect(() => {
    if (!showFullImage && imageRef.current) {
      imageRef.current.style.objectPosition = objectPosition;
      imageRef.current.style.transform = `scale(${zoom})`;
    }
    if (markerRef.current) {
      markerRef.current.style.left = `${posX}%`;
      markerRef.current.style.top = `${posY}%`;
      markerRef.current.style.transform = 'translate(-50%, -50%)';
    }
    if (crosshairHRef.current) {
      crosshairHRef.current.style.top = `${posY}%`;
    }
    if (crosshairVRef.current) {
      crosshairVRef.current.style.left = `${posX}%`;
    }
    // Update preview images
    const previews = [previewRef1.current, previewRef2.current, previewRef3.current];
    previews.forEach(ref => {
      if (ref) {
        ref.style.objectPosition = objectPosition;
        ref.style.transform = `scale(${zoom})`;
      }
    });
  }, [posX, posY, zoom, objectPosition, showFullImage]);

  const presets = [
    { label: '↖', title: 'Top Left', x: 0, y: 0 },
    { label: '↑', title: 'Top Center', x: 50, y: 0 },
    { label: '↗', title: 'Top Right', x: 100, y: 0 },
    { label: '←', title: 'Left', x: 0, y: 50 },
    { label: '●', title: 'Center', x: 50, y: 50 },
    { label: '→', title: 'Right', x: 100, y: 50 },
    { label: '↙', title: 'Bottom Left', x: 0, y: 100 },
    { label: '↓', title: 'Bottom Center', x: 50, y: 100 },
    { label: '↘', title: 'Bottom Right', x: 100, y: 100 },
  ];

  // Calculate position from mouse event
  const getPositionFromEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x), y: Math.round(y) };
  };

  // Handle mouse down - start dragging and set position
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const pos = getPositionFromEvent(e);
    if (pos) {
      setPosX(pos.x);
      setPosY(pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = getPositionFromEvent(e);
    if (pos) {
      setPosX(pos.x);
      setPosY(pos.y);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Global mouse listeners for drag outside element
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const pos = getPositionFromEvent(e);
      if (pos) {
        setPosX(pos.x);
        setPosY(pos.y);
      }
    };
    const handleGlobalMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const handleSave = () => {
    onSave({
      x: posX,
      y: posY,
      width: 100,
      height: 100,
      zoom,
      rotation: 0,
      aspectRatio: imageDimensions.aspectRatio,
      objectPosition,
    });
  };

  const handleReset = () => {
    setPosX(50);
    setPosY(50);
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Set Focus Point
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Click or drag to set where the image will be centered
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image info bar */}
          {imageLoaded && (
            <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{imageDimensions.width}</span> × <span className="font-medium text-gray-700 dark:text-gray-300">{imageDimensions.height}</span>px
                </span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                  {imageDimensions.aspectRatio}
                </span>
              </div>
              <button
                onClick={() => setShowFullImage(!showFullImage)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showFullImage ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  )}
                </svg>
                {showFullImage ? 'Cropped View' : 'Full Image'}
              </button>
            </div>
          )}

          {/* Interactive Preview */}
          <div
            ref={containerRef}
            className={`relative w-full rounded-lg overflow-hidden cursor-crosshair border-2 border-blue-500 bg-gray-900 select-none ${showFullImage ? 'aspect-auto' : 'aspect-video'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {showFullImage ? (
              <img
                src={imageUrl}
                alt="Select focus"
                className="w-full h-auto pointer-events-none transition-transform duration-150"
                draggable={false}
              />
            ) : (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Select focus"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-150"
                draggable={false}
              />
            )}

            {/* Focal point marker */}
            <div
              ref={markerRef}
              className="absolute pointer-events-none z-10"
            >
              {/* Outer ring with animation */}
              <div className="absolute -inset-4 border-2 border-white/30 rounded-full animate-ping [animation-duration:2s]" />
              {/* Main marker */}
              <div className="w-10 h-10 border-2 border-white rounded-full shadow-lg flex items-center justify-center bg-blue-500/60 backdrop-blur-sm">
                <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
              </div>
            </div>

            {/* Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div ref={crosshairHRef} className="absolute w-full h-px bg-white/30" />
              <div ref={crosshairVRef} className="absolute h-full w-px bg-white/30" />
            </div>

            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br pointer-events-none" />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-[auto_1fr] gap-4">
            {/* Preset grid */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">Quick Position</p>
              <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    title={p.title}
                    onClick={() => { setPosX(p.x); setPosY(p.y); }}
                    className={`w-8 h-8 text-base rounded-md flex items-center justify-center transition-all ${
                      posX === p.x && posY === p.y
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Horizontal (X)</label>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 rounded">{posX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posX}
                  onChange={(e) => setPosX(parseInt(e.target.value))}
                  aria-label="Horizontal position"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Vertical (Y)</label>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 rounded">{posY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posY}
                  onChange={(e) => setPosY(parseInt(e.target.value))}
                  aria-label="Vertical position"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Zoom</label>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 rounded">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  aria-label="Zoom level"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Preview Cards */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Live Preview - How it will appear</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Featured Card (16:9)
                </p>
                <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm">
                  <img ref={previewRef1} src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="w-20">
                <p className="text-[10px] text-gray-500 mb-1">Square</p>
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm">
                  <img ref={previewRef2} src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="w-14">
                <p className="text-[10px] text-gray-500 mb-1">Tall</p>
                <div className="aspect-[9/16] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm">
                  <img ref={previewRef3} src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 font-mono text-xs">
            <p className="text-gray-500 mb-1"># CSS that will be applied:</p>
            <p className="text-green-400">object-position: <span className="text-blue-400">{objectPosition}</span>;</p>
            {zoom !== 1 && <p className="text-green-400">transform: <span className="text-blue-400">scale({zoom})</span>;</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Reset to Center
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
