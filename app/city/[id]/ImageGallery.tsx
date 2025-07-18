'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Fancybox } from '@fancyapps/ui';

interface CityImage {
  id: number;
  fileName: string | null;
  originalName: string | null;
  thumbnailPath: string | null;
  mediumPath: string | null;
  largePath: string | null;
  originalPath: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean | null;
  sortOrder: number | null;
  uploadedAt: Date | null;
}

interface ImageGalleryProps {
  images: CityImage[];
  cityId: number;
  isOwner: boolean;
  onImagesChange?: (newImages: CityImage[]) => void;
}

export function ImageGallery({ images, cityId, isOwner, onImagesChange }: ImageGalleryProps) {
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // Filter out images with missing required data
  const validImages = images.filter(image => 
    image.mediumPath && image.largePath && image.originalName && image.thumbnailPath
  );

  // Show 12 thumbnails at a time (more with smaller thumbnails)
  const thumbnailsPerPage = 12;
  const displayedThumbnails = validImages.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage);
  const hasMoreImages = validImages.length > thumbnailsPerPage;
  const canScrollLeft = thumbnailStartIndex > 0;
  const canScrollRight = thumbnailStartIndex + thumbnailsPerPage < validImages.length;

  const nextMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex + 1) % displayedThumbnails.length);
  };

  const prevMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex - 1 + displayedThumbnails.length) % displayedThumbnails.length);
  };

  const scrollThumbnailsLeft = () => {
    if (canScrollLeft) {
      setThumbnailStartIndex(Math.max(0, thumbnailStartIndex - thumbnailsPerPage));
      setMainGalleryIndex(0); // Reset to first image in new set
    }
  };

  const scrollThumbnailsRight = () => {
    if (canScrollRight) {
      setThumbnailStartIndex(Math.min(validImages.length - thumbnailsPerPage, thumbnailStartIndex + thumbnailsPerPage));
      setMainGalleryIndex(0); // Reset to first image in new set
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
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

    if (isLeftSwipe && displayedThumbnails.length > 1) {
      nextMainImage();
    }
    if (isRightSwipe && displayedThumbnails.length > 1) {
      prevMainImage();
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      const response = await fetch(`/api/images/${imageId}/primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId: cityId
        }),
      });

      if (response.ok) {
        // Update local state
        const newImages = validImages.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        onImagesChange?.(newImages);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert('Failed to set primary image. Please try again.');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state
        const newImages = validImages.filter(img => img.id !== imageId);
        onImagesChange?.(newImages);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  // Initialize Fancybox
  useEffect(() => {
    Fancybox.bind('[data-fancybox="screenshots"]');

    return () => {
      Fancybox.destroy();
    };
  }, [validImages]);

  if (validImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images available for this city.
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery View */}
      <div className="mb-6">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          {/* Main Image with Touch Gestures */}
          <div 
            ref={mainImageRef}
            className="relative aspect-video group cursor-pointer select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <a
              href={displayedThumbnails[mainGalleryIndex].originalPath!}
              data-fancybox="screenshots"
              data-caption={displayedThumbnails[mainGalleryIndex].originalName!}
              data-width={displayedThumbnails[mainGalleryIndex].width}
              data-height={displayedThumbnails[mainGalleryIndex].height}
              data-original-name={displayedThumbnails[mainGalleryIndex].originalName!}
              data-is-primary={displayedThumbnails[mainGalleryIndex].isPrimary}
            >
              <Image
                src={displayedThumbnails[mainGalleryIndex].originalPath!}
                alt={displayedThumbnails[mainGalleryIndex].originalName!}
                width={1200}
                height={675}
                className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                quality={100}
              />
            </a>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            {/* Primary Badge */}
            {displayedThumbnails[mainGalleryIndex].isPrimary && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Primary
              </div>
            )}

            {/* Swipe Indicator (only show on mobile) */}
            {displayedThumbnails.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs md:hidden">
                ← Swipe →
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {displayedThumbnails.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevMainImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={nextMainImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {thumbnailStartIndex + mainGalleryIndex + 1} of {validImages.length}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Grid with Scroll Arrows */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={scrollThumbnailsLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={scrollThumbnailsRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Hidden Fancybox Gallery - All Images */}
          <div className="hidden">
            {validImages.map((image) => (
              <a
                key={`fancybox-${image.id}`}
                href={image.originalPath!}
                data-fancybox="screenshots"
                data-caption={image.originalName!}
                data-width={image.width}
                data-height={image.height}
                data-original-name={image.originalName!}
                data-is-primary={image.isPrimary}
              >
                <img src={image.thumbnailPath!} alt={image.originalName!} />
              </a>
            ))}
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 px-8">
            {displayedThumbnails.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  index === mainGalleryIndex 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setMainGalleryIndex(index)}
              >
                <a
                  href={image.originalPath!}
                  data-fancybox="screenshots"
                  data-caption={image.originalName!}
                  data-width={image.width}
                  data-height={image.height}
                  data-original-name={image.originalName!}
                  data-is-primary={image.isPrimary}
                  className="block w-full h-full"
                >
                  <Image
                    src={image.mediumPath!}
                    alt={image.originalName!}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    quality={85}
                  />
                </a>
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded-full text-xs font-medium">
                    Primary
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>

                {/* Owner Controls */}
                {isOwner && (
                  <div className="absolute top-1 right-1 flex space-x-1">
                    {/* Set Primary Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      className={`w-6 h-6 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                        image.isPrimary 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                      }`}
                      title={image.isPrimary ? 'This is your featured image (will be shown on your city page and home page)' : 'Set as featured image (will be shown on your city page and home page)'}
                    >
                      <span className={image.isPrimary ? '' : 'transform translate-y-[-1px]'}>
                        {image.isPrimary ? '✓' : '★'}
                      </span>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="w-6 h-6 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
                      title="Delete this screenshot (cannot be undone)"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 