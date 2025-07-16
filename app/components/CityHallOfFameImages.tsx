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
  createdAt: string;
  lastUpdated: string;
}

interface CityHallOfFameImagesProps {
  cityName: string;
  hofCreatorId: string | null;
  cityId: number;
}

export default function CityHallOfFameImages({ cityName, hofCreatorId, cityId }: CityHallOfFameImagesProps) {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🏆</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hall of Fame Images</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Screenshots of this city from the Hall of Fame
          </p>
        </div>
      </div>

      <HallOfFameGallery images={images} />
    </div>
  );
} 