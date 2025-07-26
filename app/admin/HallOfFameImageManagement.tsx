'use client';

import { useState, useEffect } from 'react';

interface HallOfFameImage {
  id: number;
  cityId: number | null;
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

interface City {
  id: number;
  cityName: string;
  mapName: string;
  population: number | null;
  money: number | null;
  xp: number | null;
  uploadedAt: string;
  userId: number;
  username: string;
  email: string;
}

export function HallOfFameImageManagement() {
  const [images, setImages] = useState<HallOfFameImage[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningImage, setAssigningImage] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both images and cities in parallel
      const [imagesResponse, citiesResponse] = await Promise.all([
        fetch('/api/admin/hall-of-fame-images'),
        fetch('/api/admin/cities')
      ]);

      if (!imagesResponse.ok) {
        throw new Error('Failed to fetch hall of fame images');
      }

      if (!citiesResponse.ok) {
        throw new Error('Failed to fetch cities');
      }

      const imagesData = await imagesResponse.json();
      const citiesData = await citiesResponse.json();

      setImages(imagesData.images || []);
      setCities(citiesData.cities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCity = async (imageId: number, cityId: number) => {
    try {
      setAssigningImage(imageId);
      
      const response = await fetch(`/api/admin/hall-of-fame-images/${imageId}/assign-city`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cityId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign image to city');
      }

      // Refresh the data to show the updated assignment
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign image to city');
    } finally {
      setAssigningImage(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hall of Fame Images ({images.length})
        </h3>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No hall of fame images found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                <img
                  src={image.imageUrlThumbnail}
                  alt={`Hall of Fame Image - ${image.cityName}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Primary
                  </div>
                )}
              </div>

              {/* Image Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {image.cityName || 'Unassigned'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {image.hofImageId}
                  </p>
                </div>

                {/* City Stats */}
                {(image.cityPopulation || image.cityMilestone) && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {image.cityPopulation && (
                      <p>Population: {image.cityPopulation.toLocaleString()}</p>
                    )}
                    {image.cityMilestone && (
                      <p>Milestone: {image.cityMilestone}</p>
                    )}
                  </div>
                )}

                {/* Assignment Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign to City:
                  </label>
                  <select
                    value={image.cityId || ''}
                    onChange={(e) => {
                      const cityId = e.target.value ? parseInt(e.target.value) : null;
                      if (cityId) {
                        handleAssignCity(image.id, cityId);
                      }
                    }}
                    disabled={assigningImage === image.id}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.cityName} (by {city.username})
                      </option>
                    ))}
                  </select>
                  {assigningImage === image.id && (
                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      Assigning...
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Created: {formatDate(image.createdAt)}</p>
                  <p>Updated: {formatDate(image.lastUpdated)}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <a
                    href={image.imageUrl4K}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    View Full Size
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 