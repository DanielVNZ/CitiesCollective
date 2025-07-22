'use client';

import { useState, useEffect } from 'react';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from 'app/components/ImageManager';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ImageSortSelector from 'app/components/ImageSortSelector';
import { useImageSorting } from 'app/hooks/useImageSorting';

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
  const [imageLikeStates, setImageLikeStates] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [imageViewCounts, setImageViewCounts] = useState<Record<string, number>>({});
  const { currentSort, handleSortChange } = useImageSorting('most-recent');

  const handleImagesChange = (newImages: CityImage[]) => {
    setImages(newImages);
  };

  // Fetch like states and view counts for all images
  useEffect(() => {
    const fetchImageStats = async () => {
      const likeStates: Record<string, { liked: boolean; count: number }> = {};
      const viewCounts: Record<string, number> = {};
      
      for (const image of images) {
        try {
          // Fetch like data
          const likeResponse = await fetch(`/api/images/${image.id}/like?type=screenshot`);
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            likeStates[image.id.toString()] = {
              liked: likeData.isLiked,
              count: likeData.likeCount
            };
          }

          // Fetch view count
          const viewResponse = await fetch(`/api/images/${image.id}/view?type=screenshot`);
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            viewCounts[image.id.toString()] = viewData.viewCount || 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for image ${image.id}:`, error);
          likeStates[image.id.toString()] = { liked: false, count: 0 };
          viewCounts[image.id.toString()] = 0;
        }
      }
      
      setImageLikeStates(likeStates);
      setImageViewCounts(viewCounts);
    };

    if (images.length > 0) {
      fetchImageStats();
    }
  }, [images]);

  // Sort images based on current sort option
  const sortedImages = [...images].sort((a, b) => {
    const aLikeCount = imageLikeStates[a.id.toString()]?.count || 0;
    const bLikeCount = imageLikeStates[b.id.toString()]?.count || 0;
    const aViewCount = imageViewCounts[a.id.toString()] || 0;
    const bViewCount = imageViewCounts[b.id.toString()] || 0;
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    switch (currentSort) {
      case 'most-recent':
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      
      case 'most-liked':
        return bLikeCount - aLikeCount;
      
      case 'most-likes-per-day':
        const aAgeDays = Math.max(1, (now.getTime() - new Date(a.uploadedAt || 0).getTime()) / oneDayMs);
        const bAgeDays = Math.max(1, (now.getTime() - new Date(b.uploadedAt || 0).getTime()) / oneDayMs);
        const aLikesPerDay = aLikeCount / aAgeDays;
        const bLikesPerDay = bLikeCount / bAgeDays;
        return bLikesPerDay - aLikesPerDay;
      
      case 'best-like-view-ratio':
        const aRatio = aViewCount > 0 ? aLikeCount / aViewCount : 0;
        const bRatio = bViewCount > 0 ? bLikeCount / bViewCount : 0;
        return bRatio - aRatio;
      
      case 'most-views-per-day':
        const aViewAgeDays = Math.max(1, (now.getTime() - new Date(a.uploadedAt || 0).getTime()) / oneDayMs);
        const bViewAgeDays = Math.max(1, (now.getTime() - new Date(b.uploadedAt || 0).getTime()) / oneDayMs);
        const aViewsPerDay = aViewCount / aViewAgeDays;
        const bViewsPerDay = bViewCount / bViewAgeDays;
        return bViewsPerDay - aViewsPerDay;
      
      case 'most-viewed':
        return bViewCount - aViewCount;
      
      default:
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
    }
  });

  return (
    <>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          {/* Sort Controls */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort images:</span>
              <ImageSortSelector
                currentSort={currentSort}
                onSortChange={handleSortChange}
                size="sm"
              />
            </div>
            {isOwner && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Owner Controls:</span> ★ Set as featured image • ✓ Featured image • × Delete
                </p>
              </div>
            )}
          </div>
          
          <ImageGallery 
            images={sortedImages} 
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