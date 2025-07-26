'use client';

import { useState, useRef, useEffect } from 'react';
import { MobileOptimizedImage } from './MobileOptimizedImage';
import { TouchGestureHandler, getDeviceInfo } from '../utils/mobile-image-optimization';

interface MobileTouchGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  initialIndex?: number;
  onImageChange?: (index: number) => void;
  className?: string;
}

export function MobileTouchGallery({
  images,
  initialIndex = 0,
  onImageChange,
  className = '',
}: MobileTouchGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler | null>(null);
  const [deviceInfo] = useState(() => getDeviceInfo());

  // Initialize touch gesture handler
  useEffect(() => {
    if (!galleryRef.current || !deviceInfo.isMobile) return;

    gestureHandlerRef.current = new TouchGestureHandler(galleryRef.current, {
      onSwipeLeft: () => {
        if (!isZoomed) {
          goToNext();
        }
      },
      onSwipeRight: () => {
        if (!isZoomed) {
          goToPrevious();
        }
      },
      onPinchZoom: (scale) => {
        setZoomScale(scale);
        setIsZoomed(scale > 1.2);
      },
      onDoubleTap: () => {
        if (isZoomed) {
          setZoomScale(1);
          setIsZoomed(false);
        } else {
          setZoomScale(2);
          setIsZoomed(true);
        }
      },
    });

    return () => {
      gestureHandlerRef.current?.destroy();
    };
  }, [isZoomed]);

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    onImageChange?.(nextIndex);
    resetZoom();
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onImageChange?.(prevIndex);
    resetZoom();
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    onImageChange?.(index);
    resetZoom();
    setShowThumbnails(false);
  };

  const resetZoom = () => {
    setZoomScale(1);
    setIsZoomed(false);
  };

  const toggleThumbnails = () => {
    setShowThumbnails(!showThumbnails);
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-gray-500 dark:text-gray-400">No images available</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Main image container */}
      <div
        ref={galleryRef}
        className="relative h-64 md:h-96 overflow-hidden"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center',
          transition: isZoomed ? 'none' : 'transform 0.3s ease',
        }}
      >
        <MobileOptimizedImage
          src={currentImage.src}
          alt={currentImage.alt}
          fill
          imageType="large"
          priority={currentIndex === 0}
          enableTouchOptimization={true}
          preloadSiblings={[
            images[(currentIndex + 1) % images.length]?.src,
            images[currentIndex === 0 ? images.length - 1 : currentIndex - 1]?.src,
          ].filter(Boolean)}
        />

        {/* Touch indicators for mobile */}
        {deviceInfo.isMobile && !isZoomed && (
          <>
            {/* Swipe indicators */}
            <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </>
        )}

        {/* Zoom indicator */}
        {isZoomed && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {Math.round(zoomScale * 100)}%
          </div>
        )}
      </div>

      {/* Gallery controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Image counter */}
          <div className="text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Control buttons */}
          <div className="flex items-center space-x-2">
            {/* Thumbnail toggle */}
            <button
              onClick={toggleThumbnails}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Toggle thumbnails"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Zoom reset */}
            {isZoomed && (
              <button
                onClick={resetZoom}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Reset zoom"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-2 w-full bg-white/20 rounded-full h-1">
          <div
            className="bg-white rounded-full h-1 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && (
        <div className="absolute bottom-16 left-0 right-0 bg-black/90 p-2">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent hover:border-white/50'
                }`}
              >
                <MobileOptimizedImage
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  width={64}
                  height={48}
                  imageType="thumbnail"
                  enableLazyLoading={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Touch instruction overlay (shown briefly on first load) */}
      {deviceInfo.isMobile && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none opacity-0 animate-pulse">
          <div className="text-white text-center">
            <div className="text-sm mb-2">Touch gestures:</div>
            <div className="text-xs space-y-1">
              <div>Swipe left/right to navigate</div>
              <div>Pinch to zoom</div>
              <div>Double tap to zoom</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}