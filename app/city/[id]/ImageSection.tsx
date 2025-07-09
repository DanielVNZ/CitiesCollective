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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Screenshots</h2>
          <ImageGallery images={images} />
        </div>
      )}

      {/* Image Management (for owners) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Manage Images</h2>
          <ImageManager cityId={cityId} images={images} onImagesChange={handleImagesChange} />
        </div>
      )}
    </>
  );
} 