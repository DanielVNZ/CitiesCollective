'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HallOfFameImage {
  id: number;
  cityId: number;
  hofImageId: string;
  cityName: string;
  cityPopulation: number | null;
  cityMilestone: number | null;
  imageUrlThumbnail: string;
  imageUrlFHD: string;
  imageUrl4K: string;
  createdAt: string;
  lastUpdated: string;
}

interface HallOfFameGalleryProps {
  images: HallOfFameImage[];
}

export function HallOfFameGallery({ images }: HallOfFameGalleryProps) {
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<HallOfFameImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image: HallOfFameImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setSelectedImage(images[(currentIndex + 1) % images.length]);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setSelectedImage(images[(currentIndex - 1 + images.length) % images.length]);
  };

  const nextMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevMainImage = () => {
    setMainGalleryIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
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

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Hall of Fame images available for this city.
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery View */}
      <div className="mb-6">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          {/* Main Image */}
          <div className="relative aspect-video group cursor-pointer" onClick={() => openLightbox(images[mainGalleryIndex], mainGalleryIndex)}>
            <Image
              src={images[mainGalleryIndex].imageUrl4K}
              alt={`${images[mainGalleryIndex].cityName} Hall of Fame screenshot`}
              width={1200}
              height={675}
              className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
              quality={100}
              unoptimized={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          {images.length > 1 && (
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
                {mainGalleryIndex + 1} of {images.length}
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
          {images.map((image, index) => (
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
                src={image.imageUrlThumbnail}
                alt={`${image.cityName} Hall of Fame screenshot`}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                quality={85}
                unoptimized={true}
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
              />
              
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
      {selectedImage && (
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
            {images.length > 1 && (
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
            {images.length > 1 && (
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
              src={selectedImage.imageUrl4K}
              alt={`${selectedImage.cityName} Hall of Fame screenshot`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              unoptimized={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{selectedImage.cityName}</h3>
                  <p className="text-sm text-gray-300">
                    Hall of Fame Screenshot • {new Date(selectedImage.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    {currentIndex + 1} of {images.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 