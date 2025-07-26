'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import Image from 'next/image';

interface CityImage {
  id: number;
  fileName: string;
  isPrimary: boolean;
  mediumPath: string;
  largePath: string;
  thumbnailPath: string;
  isHallOfFame?: boolean;
}

interface ImageGalleryProps {
  images: CityImage[];
  cityName: string;
  isContentCreator: boolean;
  onImageChange?: (index: number) => void;
}

export const ImageGallery = memo(function ImageGallery({ images, cityName, isContentCreator, onImageChange }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);
  const [imageError, setImageError] = useState<boolean[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort images: Primary first, then Hall of Fame, then others (memoized for performance)
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      if (a.isHallOfFame && !b.isHallOfFame) return -1;
      if (!a.isHallOfFame && b.isHallOfFame) return 1;
      return 0;
    });
  }, [images]);

  // Limit to 4 images for gallery display
  const displayImages = useMemo(() => sortedImages.slice(0, 4), [sortedImages]);
  const hasMoreImages = sortedImages.length > 4;
  const totalDisplayItems = hasMoreImages ? 5 : displayImages.length; // 4 images + 1 "view more" item

  // Initialize loading and error states
  useEffect(() => {
    setImageLoading(new Array(displayImages.length).fill(true));
    setImageError(new Array(displayImages.length).fill(false));
  }, [displayImages.length]);

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
    setImageError(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageLoading(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
    setImageError(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  }, []);

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < totalDisplayItems && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      onImageChange?.(index);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }
  }, [totalDisplayItems, isTransitioning, onImageChange]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : totalDisplayItems - 1;
    goToImage(newIndex);
  }, [currentIndex, totalDisplayItems, goToImage]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < totalDisplayItems - 1 ? currentIndex + 1 : 0;
    goToImage(newIndex);
  }, [currentIndex, totalDisplayItems, goToImage]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (containerRef.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Preload current, next, and previous images for faster switching
  useEffect(() => {
    const preloadIndexes = [
      currentIndex, // Current image
      currentIndex > 0 ? currentIndex - 1 : totalDisplayItems - 1, // Previous
      currentIndex < totalDisplayItems - 1 ? currentIndex + 1 : 0, // Next
    ];

    preloadIndexes.forEach((index) => {
      if (index < displayImages.length) {
        const image = displayImages[index];
        const imagePath = image.mediumPath || image.largePath || image.thumbnailPath;
        if (imagePath) {
          const img = new window.Image();
          img.onload = () => handleImageLoad(index);
          img.onerror = () => handleImageError(index);
          img.src = imagePath;
        }
      }
    });
  }, [currentIndex, displayImages, totalDisplayItems, handleImageLoad, handleImageError]);

  // Check if current index is the "view more" item (must be before early return)
  const isViewMoreItem = hasMoreImages && currentIndex === 4;
  const currentImage = useMemo(() =>
    displayImages.length > 0 && !isViewMoreItem ? displayImages[currentIndex] : null,
    [displayImages, currentIndex, isViewMoreItem]
  );
  const imagePath = useMemo(() =>
    currentImage?.mediumPath || currentImage?.largePath || currentImage?.thumbnailPath,
    [currentImage]
  );

  if (!displayImages.length) {
    return (
      <div className="relative w-full h-48 bg-gray-900/80 text-white flex flex-col items-center justify-center">
        <span className="text-4xl mb-2">🏙️</span>
        <span className="text-sm text-center">This city is so mysterious,<br />no pictures to see here!</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 group overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="img"
      aria-label={isViewMoreItem ? `View more images for ${cityName}` : `Image ${currentIndex + 1} of ${totalDisplayItems} for ${cityName}`}
    >
      {/* Main Image or View More */}
      <div className="relative w-full h-full">
        {isViewMoreItem ? (
          /* View More Item */
          <div className="relative w-full h-full bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 flex flex-col items-center justify-center text-white">
            <div className="text-center p-6">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">+{sortedImages.length - 4} More Photos</h3>
            </div>
          </div>
        ) : (
          /* Regular Image */
          <>
            {imageLoading[currentIndex] && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse">
                <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            )}

            {imageError[currentIndex] ? (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Failed to load image</span>
              </div>
            ) : (
              <Image
                src={imagePath || '/placeholder-image.png'}
                alt={`Image ${currentIndex + 1} of ${cityName}`}
                fill
                style={{ objectFit: 'cover' }}
                className={`transition-all duration-200 ${imageLoading[currentIndex] ? 'opacity-0' : 'opacity-100'
                  } ${isTransitioning ? 'scale-105' : 'group-hover:scale-105'}`}
                priority={currentIndex <= 1} // Prioritize first 2 images
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={75} // Slightly lower quality for faster loading
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
              />
            )}
          </>
        )}
      </div>

      {/* Hall of Fame Badge */}
      {!isViewMoreItem && currentImage?.isHallOfFame && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="rounded-full p-1 shadow-lg bg-transparent">
            <Image
              src="/logo/hof-icon.svg"
              alt="Hall of Fame"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        </div>
      )}

      {/* Navigation Controls - Desktop */}
      {totalDisplayItems > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Previous image"
            disabled={isTransitioning}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Next image"
            disabled={isTransitioning}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image Indicators */}
      {totalDisplayItems > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
          {Array.from({ length: totalDisplayItems }).map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToImage(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
                } ${index === 4 && hasMoreImages ? 'bg-blue-400' : ''}`}
              aria-label={index === 4 && hasMoreImages ? 'View more images' : `Go to image ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}
    </div>
  );
});