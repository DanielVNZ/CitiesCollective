'use client';

import { useState } from 'react';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from 'app/components/ImageManager';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

interface ImageSectionProps {
  cityId: number;
  initialImages: CityImage[];
  isOwner: boolean;
}

export function ImageSection({ cityId, initialImages, isOwner }: ImageSectionProps) {
  const [images, setImages] = useState<CityImage[]>(initialImages);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImagesChange = (newImages: CityImage[]) => {
    setImages(newImages);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Screenshots</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            User-uploaded screenshots of this city
          </p>
          <ImageGallery images={images} />
        </div>
      )}

      {/* Image Management (for owners) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <button 
            onClick={toggleExpand}
            className="flex items-center w-full text-left focus:outline-none"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Images</h2>
          </button>
          {isExpanded && (
            <div className="mt-3">
              <ImageManager cityId={cityId} images={images} onImagesChange={handleImagesChange} />
            </div>
          )}
        </div>
      )}

      {/* Spacing to align with Hall of Fame Images */}
      {!isOwner && (
        <div className="h-20"></div>
      )}
    </>
  );
}