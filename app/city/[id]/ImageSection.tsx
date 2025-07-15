'use client';

import { useState } from 'react';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from 'app/components/ImageManager';

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Screenshots</h2>
          <ImageGallery images={images} />
        </div>
      )}

      {/* Image Management (for owners) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Manage Images</h2>
          <ImageManager cityId={cityId} images={images} onImagesChange={handleImagesChange} />
        </div>
      )}
    </>
  );
} 