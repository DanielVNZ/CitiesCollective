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

  const handleImagesChange = (newImages: CityImage[]) => {
    setImages(newImages);
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
          {isOwner && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Owner Controls:</span> ★ Set as featured image • ✓ Featured image • × Delete
              </p>
            </div>
          )}
          <ImageGallery 
            images={images} 
            cityId={cityId}
            isOwner={isOwner}
            onImagesChange={handleImagesChange}
          />
        </div>
      )}

      {/* Spacing to align with Hall of Fame Images */}
      {!isOwner && (
        <div className="h-20"></div>
      )}
    </>
  );
}