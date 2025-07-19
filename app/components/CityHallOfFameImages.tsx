'use client';

import { useState, useEffect } from 'react';
import { HallOfFameGallery } from './HallOfFameGallery';

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
      {isOwner && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <span className="font-semibold">Owner Controls:</span> ★ Set as featured image • ✓ Featured image
          </p>
        </div>
      )}

      <HallOfFameGallery 
        images={images} 
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