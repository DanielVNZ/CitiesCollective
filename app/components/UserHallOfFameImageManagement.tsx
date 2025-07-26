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
  externalData?: boolean; // Flag to indicate this is from external API
  manuallyAssigned?: boolean; // Flag to indicate if this was manually assigned
}

interface City {
  id: number;
  cityName: string | null;
  mapName: string | null;
  population: number | null;
  money: number | null;
  xp: number | null;
  uploadedAt: Date | string | null;
}

interface UserHallOfFameImageManagementProps {
  userId: number;
  cities: City[];
  hofCreatorId?: string | null;
}

export function UserHallOfFameImageManagement({ userId, cities, hofCreatorId }: UserHallOfFameImageManagementProps) {
  const [images, setImages] = useState<HallOfFameImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningImage, setAssigningImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'unassigned' | number>('all'); // 'all', 'unassigned', or cityId

  useEffect(() => {
    if (hofCreatorId) {
      fetchImages();
    } else {
      setLoading(false);
    }
  }, [userId, hofCreatorId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/hall-of-fame-images');
      
      if (!response.ok) {
        throw new Error('Failed to fetch hall of fame images');
      }

      const data = await response.json();
      console.log('Received images data:', data);
      console.log('Number of images:', data.images?.length || 0);
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCity = async (image: HallOfFameImage, cityId: number | null) => {
    try {
      setAssigningImage(image.id);
      
      // If cityId is null, we're unassigning
      if (cityId === null) {
        // For unassignment, we need to clear the assignment in the database
        const response = await fetch(`/api/user/hall-of-fame-images/unassign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hofImageId: image.hofImageId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to unassign image');
        }

        // Update local state to show as unassigned
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id 
              ? { ...img, cityId: null, cityName: image.cityName, manuallyAssigned: false }
              : img
          )
        );
        return;
      }

      // Regular assignment logic
      const city = cities.find(c => c.id === cityId);
      if (!city) {
        throw new Error('City not found');
      }

      const response = await fetch(`/api/user/hall-of-fame-images/assign-city`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hofImageId: image.hofImageId,
          cityId: cityId,
          cityName: city.cityName || 'Unknown City',
          imageData: {
            cityPopulation: image.cityPopulation,
            cityMilestone: image.cityMilestone,
            imageUrlThumbnail: image.imageUrlThumbnail,
            imageUrlFHD: image.imageUrlFHD,
            imageUrl4K: image.imageUrl4K,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign image to city');
      }

      // Update the local state immediately instead of refreshing from external API
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === image.id 
            ? { ...img, cityId: cityId, cityName: city.cityName || 'Unknown City', manuallyAssigned: true }
            : img
        )
      );
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

  // Filter images based on current filter
  const filteredImages = images.filter((image) => {
    if (filter === 'all') return true;
    if (filter === 'unassigned') return !image.cityId;
    return image.cityId === filter;
  });

  // Get unique cities that have assigned images
  const assignedCities = cities.filter(city => 
    images.some(image => image.cityId === city.id)
  );

  if (!hofCreatorId) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🏆</div>
        <p className="text-gray-500 dark:text-gray-400">
          No Hall of Fame Creator ID configured.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Configure your Hall of Fame Creator ID above to see your hall of fame images.
        </p>
      </div>
    );
  }

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
          onClick={fetchImages}
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hall of Fame Images ({filteredImages.length} of {images.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assign your hall of fame images to your cities
          </p>
        </div>
        <button
          onClick={fetchImages}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by:
          </span>
          
          {/* All Images */}
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({images.length})
          </button>

          {/* Unassigned Images */}
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'unassigned'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Unassigned ({images.filter(img => !img.cityId).length})
          </button>

          {/* Assigned Cities */}
          {assignedCities.map((city) => (
            <button
              key={city.id}
              onClick={() => setFilter(city.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === city.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {city.cityName || 'Unnamed City'} ({images.filter(img => img.cityId === city.id).length})
            </button>
          ))}
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <p className="text-gray-500 dark:text-gray-400">
            {images.length === 0 
              ? 'No hall of fame images found.'
              : `No images match the current filter.`
            }
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {images.length === 0 
              ? 'Hall of fame images from your Creator ID will appear here once they\'re available.'
              : 'Try changing the filter to see more images.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
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
                  onError={(e) => {
                    console.error('Failed to load image:', image.imageUrlThumbnail);
                    console.error('Image data:', image);
                    // Show a fallback
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  onLoad={() => {
                    console.log('Successfully loaded image:', image.imageUrlThumbnail);
                  }}
                />
                {/* Fallback when image fails to load */}
                <div className="hidden w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm">Image unavailable</p>
                  </div>
                </div>
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

                                 {/* Assignment Dropdown - Only show user's cities */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Assign to City:
                   </label>
                   <select
                     value={image.cityId || ''}
                     onChange={(e) => {
                       const cityId = e.target.value ? parseInt(e.target.value) : null;
                       handleAssignCity(image, cityId);
                     }}
                     disabled={assigningImage === image.id}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="">Unassigned</option>
                     {cities.map((city) => (
                       <option key={city.id} value={city.id}>
                         {city.cityName || 'Unnamed City'}
                       </option>
                     ))}
                   </select>
                   {assigningImage === image.id && (
                     <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                       Assigning...
                     </div>
                   )}
                   {!image.cityId && (
                     <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                       This image is not assigned to any city
                     </div>
                   )}
                   {image.cityId && image.manuallyAssigned && (
                     <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                       Manually assigned to city
                     </div>
                   )}
                   {image.cityId && !image.manuallyAssigned && (
                     <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                       Auto-assigned to matching city
                     </div>
                   )}
                   {image.externalData && (
                     <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                       From Hall of Fame API
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