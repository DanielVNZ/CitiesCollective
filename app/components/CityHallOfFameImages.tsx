'use client';

import { useState, useEffect } from 'react';
import { HallOfFameGallery } from './HallOfFameGallery';
import ImageSortSelector from './ImageSortSelector';
import { useImageSorting } from 'app/hooks/useImageSorting';

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
  isPrimary: boolean;
  createdAt: string;
  lastUpdated: string;
}

interface CityHallOfFameImagesProps {
  cityName: string;
  hofCreatorId: string | null;
  cityId: number;
  isOwner: boolean;
  isFeaturedOnHomePage?: boolean;
  deepLinkImageId?: string | null;
  deepLinkImageType?: string | null;
  deepLinkCommentId?: string | null;
}

export default function CityHallOfFameImages({ cityName, hofCreatorId, cityId, isOwner, isFeaturedOnHomePage = false, deepLinkImageId, deepLinkImageType, deepLinkCommentId }: CityHallOfFameImagesProps) {
  const [images, setImages] = useState<HallOfFameImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLikeStates, setImageLikeStates] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [imageViewCounts, setImageViewCounts] = useState<Record<string, number>>({});
  const { currentSort, handleSortChange } = useImageSorting('most-recent');

  useEffect(() => {
    const fetchCachedHallOfFameImages = async () => {
      if (!hofCreatorId || hofCreatorId.trim() === '') {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/cities/${cityId}/hall-of-fame-images`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch Hall of Fame images');
        }

        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching images');
      } finally {
        setLoading(false);
      }
    };

    fetchCachedHallOfFameImages();
  }, [cityId, hofCreatorId]);

  // Fetch like states and view counts for all images
  useEffect(() => {
    const fetchImageStats = async () => {
      const likeStates: Record<string, { liked: boolean; count: number }> = {};
      const viewCounts: Record<string, number> = {};
      
      for (const image of images) {
        try {
          // Fetch like data
          const likeResponse = await fetch(`/api/images/${image.hofImageId}/like?type=hall_of_fame`);
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            likeStates[image.hofImageId] = {
              liked: likeData.isLiked,
              count: likeData.likeCount
            };
          }

          // Fetch view count
          const viewResponse = await fetch(`/api/images/${image.hofImageId}/view?type=hall_of_fame`);
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            viewCounts[image.hofImageId] = viewData.viewCount || 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for Hall of Fame image ${image.hofImageId}:`, error);
          likeStates[image.hofImageId] = { liked: false, count: 0 };
          viewCounts[image.hofImageId] = 0;
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
    const aLikeCount = imageLikeStates[a.hofImageId]?.count || 0;
    const bLikeCount = imageLikeStates[b.hofImageId]?.count || 0;
    const aViewCount = imageViewCounts[a.hofImageId] || 0;
    const bViewCount = imageViewCounts[b.hofImageId] || 0;
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    switch (currentSort) {
      case 'most-recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      
      case 'most-liked':
        return bLikeCount - aLikeCount;
      
      case 'most-likes-per-day':
        const aAgeDays = Math.max(1, (now.getTime() - new Date(a.createdAt).getTime()) / oneDayMs);
        const bAgeDays = Math.max(1, (now.getTime() - new Date(b.createdAt).getTime()) / oneDayMs);
        const aLikesPerDay = aLikeCount / aAgeDays;
        const bLikesPerDay = bLikeCount / bAgeDays;
        return bLikesPerDay - aLikesPerDay;
      
      case 'best-like-view-ratio':
        const aRatio = aViewCount > 0 ? aLikeCount / aViewCount : 0;
        const bRatio = bViewCount > 0 ? bLikeCount / bViewCount : 0;
        return bRatio - aRatio;
      
      case 'most-views-per-day':
        const aViewAgeDays = Math.max(1, (now.getTime() - new Date(a.createdAt).getTime()) / oneDayMs);
        const bViewAgeDays = Math.max(1, (now.getTime() - new Date(b.createdAt).getTime()) / oneDayMs);
        const aViewsPerDay = aViewCount / aViewAgeDays;
        const bViewsPerDay = bViewCount / bViewAgeDays;
        return bViewsPerDay - aViewsPerDay;
      
      case 'most-viewed':
        return bViewCount - aViewCount;
      
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Don't render anything if no creator ID or if still loading
  if (!hofCreatorId || hofCreatorId.trim() === '' || loading) {
    return null;
  }

  // Don't render anything if no matching images found
  if (images.length === 0) {
    return null;
  }

  // Don't render anything if there was an error
  if (error) {
    return null;
  }

  return (
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
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <span className="font-semibold">Owner Controls:</span> ★ Set as featured image • ✓ Featured image
            </p>
          </div>
        )}
      </div>

      <HallOfFameGallery 
        images={sortedImages} 
        cityId={cityId}
        isOwner={isOwner}
        isFeaturedOnHomePage={isFeaturedOnHomePage}
        hofCreatorId={hofCreatorId}
        deepLinkImageId={deepLinkImageId}
        deepLinkImageType={deepLinkImageType}
        deepLinkCommentId={deepLinkCommentId}
      />
    </div>
  );
} 