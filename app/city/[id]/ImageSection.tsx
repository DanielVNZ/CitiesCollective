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
  deepLinkImageId?: string | null;
  deepLinkImageType?: string | null;
  deepLinkCommentId?: string | null;
}

export function ImageSection({ cityId, initialImages, isOwner, deepLinkImageId, deepLinkImageType, deepLinkCommentId }: ImageSectionProps) {
  const [images, setImages] = useState<CityImage[]>(initialImages);
  const [showManager, setShowManager] = useState(false);

  const handleImagesChange = (newImages: CityImage[]) => {
    setImages(newImages);
  };

  return (
    <>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
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
            deepLinkImageId={deepLinkImageId}
            deepLinkImageType={deepLinkImageType}
            deepLinkCommentId={deepLinkCommentId}
          />
        </div>
      )}

      {/* Image Management Section for Owners */}
      {isOwner && (
        <div className="mt-8">
          <button
            onClick={() => setShowManager(!showManager)}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            {showManager ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
            <span>{showManager ? 'Hide' : 'Show'} Image Management</span>
          </button>
          
          {showManager && (
            <div className="mt-4">
              <ImageManager 
                cityId={cityId} 
                images={images} 
                onImagesChange={handleImagesChange}
              />
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