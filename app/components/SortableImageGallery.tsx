'use client';

import { useState, useEffect } from 'react';
import ImageSortSelector, { ImageSortOption } from './ImageSortSelector';
import { useImageSorting } from '../hooks/useImageSorting';
import { sortImages, SortableImage } from '../utils/imageSorting';

interface SortableImageGalleryProps {
  images: SortableImage[];
  title?: string;
  showSortSelector?: boolean;
  defaultSort?: ImageSortOption;
  className?: string;
}

export default function SortableImageGallery({ 
  images, 
  title = "Images", 
  showSortSelector = true, 
  defaultSort = 'most-recent',
  className = ''
}: SortableImageGalleryProps) {
  const { currentSort, handleSortChange } = useImageSorting(defaultSort);
  const [sortedImages, setSortedImages] = useState<SortableImage[]>(images);

  // Sort images when sort option or images change
  useEffect(() => {
    setSortedImages(sortImages(images, currentSort));
  }, [images, currentSort]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with title and sort selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title} ({images.length})
        </h3>
        
        {showSortSelector && images.length > 1 && (
          <ImageSortSelector
            currentSort={currentSort}
            onSortChange={handleSortChange}
            size="sm"
          />
        )}
      </div>

      {/* Images Grid */}
      {sortedImages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No images to display
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedImages.map((image) => (
            <div 
              key={image.id} 
              className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image placeholder - replace with actual image component */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-sm">
                  Image {image.id}
                </span>
              </div>
              
              {/* Image stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs">
                <div className="flex items-center justify-between">
                  <span>❤️ {image.likeCount || 0}</span>
                  <span>👁️ {image.viewCount || 0}</span>
                </div>
                <div className="text-gray-300">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sort info */}
      {showSortSelector && images.length > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Sorted by: {currentSort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      )}
    </div>
  );
} 