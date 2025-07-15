'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  uploadedAt: Date | null;
}

interface ImageGalleryProps {
  images: CityImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<CityImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);

  // Filter out images with missing required data
  const validImages = images.filter(image => 
    image.mediumPath && image.largePath && image.originalName && image.thumbnailPath
  );

  const openLightbox = (image: CityImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % validImages.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(validImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + validImages.length) % validImages.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(validImages[prevIndex]);
  };

  const nextMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex + 1) % validImages.length);
  };

  const prevMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex - 1 + validImages.length) % validImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  };

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
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden max-w-4xl mx-auto">
          {/* Main Image */}
          <div className="relative aspect-video">
            <Image
              src={validImages[mainGalleryIndex].originalPath!}
              alt={validImages[mainGalleryIndex].originalName!}
              width={1200}
              height={675}
              className="w-full h-full object-contain"
              onClick={() => openLightbox(validImages[mainGalleryIndex], mainGalleryIndex)}
              quality={100}
            />
            
            {/* Primary Badge */}
            {validImages[mainGalleryIndex].isPrimary && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Primary
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {validImages.length > 1 && (
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
                {mainGalleryIndex + 1} of {validImages.length}
              </div>
            </>
          )}

          {/* Click to Enlarge Hint */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            Click to enlarge
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {validImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                index === mainGalleryIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setMainGalleryIndex(index)}
            >
              <Image
                src={image.mediumPath!}
                alt={image.originalName!}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                quality={85}
              />
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded-full text-xs font-medium">
                  Primary
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && selectedImage.largePath && selectedImage.originalName && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[10000] flex items-center justify-center p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous Button */}
            {validImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next Button */}
            {validImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <Image
              src={selectedImage.originalPath!}
              alt={selectedImage.originalName}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{selectedImage.originalName}</h3>
                  <p className="text-sm text-gray-300">
                    {selectedImage.width || 'Unknown'} × {selectedImage.height || 'Unknown'} pixels
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    {currentIndex + 1} of {validImages.length}
                  </p>
                  {selectedImage.isPrimary && (
                    <span className="inline-block bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium mt-1">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 