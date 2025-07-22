'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CityCard } from 'app/components/CityCard';
import { ImageFilterToggle } from 'app/components/ImageFilterToggle';
import ImageSortSelector from 'app/components/ImageSortSelector';
import { useImageSorting } from 'app/hooks/useImageSorting';
import { sortImages } from 'app/utils/imageSorting';

interface City {
  id: number;
  userId: number | null;
  cityName: string | null;
  mapName: string | null;
  population: number | null;
  money: number | null;
  xp: number | null;
  unlimitedMoney: boolean | null;
  uploadedAt: Date | null;
  likeCount?: number;
  viewCount?: number;
  user: {
    id: number;
    username: string | null;
  } | null;
  images: Array<{
    id: number;
    fileName: string;
    isPrimary: boolean;
    mediumPath: string;
    largePath: string;
    thumbnailPath: string;
    isHallOfFame?: boolean;
  }>;
  commentCount: number;
}

interface ClientPaginationWrapperProps {
  initialCities: City[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  offset: number;
  citiesWithImages: number;
}

export function ClientPaginationWrapper({ 
  initialCities,
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  offset,
  citiesWithImages
}: ClientPaginationWrapperProps) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(currentPage);
  const [cities, setCities] = useState<City[]>(initialCities);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(searchParams.get('withImages') === 'true');
  const { currentSort, handleSortChange } = useImageSorting('most-recent');

  // Update local state when URL changes
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlWithImages = searchParams.get('withImages') === 'true';
    
    setPage(urlPage);
    setShowOnlyWithImages(urlWithImages);
  }, [searchParams]);

  // Force re-render when sort changes
  useEffect(() => {
    // This effect will run whenever currentSort changes
    // The component will re-render and re-sort the cities
  }, [currentSort]);

  // Handle toggle - just filter the existing data
  const handleToggleImages = (showOnly: boolean) => {
    setShowOnlyWithImages(showOnly);
    setPage(1); // Reset to first page
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (showOnly) {
      params.set('withImages', 'true');
    } else {
      params.delete('withImages');
    }
    window.history.replaceState({}, '', `/?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    if (showOnlyWithImages) {
      params.set('withImages', 'true');
    } else {
      params.delete('withImages');
    }
    window.history.replaceState({}, '', `/?${params.toString()}`);
  };

  // 1. Filter cities based on toggle
  const filteredCities = showOnlyWithImages 
    ? cities.filter(city => city.images && city.images.length > 0)
    : cities;

  // 2. Sort all cities by upload date (most recent first) - NEVER separate them
  const sortedCities = filteredCities.sort((a, b) => {
    const aDate = typeof a.uploadedAt === 'string' ? new Date(a.uploadedAt) : a.uploadedAt || new Date(0);
    const bDate = typeof b.uploadedAt === 'string' ? new Date(b.uploadedAt) : b.uploadedAt || new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  // 3. Cap at 30 cities
  const maxCities = 30;
  const cappedCities = sortedCities.slice(0, maxCities);

  // 4. Sort ALL cities together (no separation)
  
  // Prepare ALL cities for sorting (cities with images use image data, cities without use city data)
  const citiesForSorting = cappedCities.map(city => {
    if (city.images && city.images.length > 0) {
      // Cities with images - use image data for sorting
      const primaryImage = city.images?.find((img: any) => img.isPrimary) || city.images?.[0];
      return {
        city,
        sortableImage: {
          id: primaryImage.id,
          uploadedAt: typeof city.uploadedAt === 'string' ? city.uploadedAt : city.uploadedAt?.toISOString() || new Date().toISOString(),
          likeCount: city.likeCount || 0,
          viewCount: city.viewCount || 0
        }
      };
    } else {
      // Cities without images - use city data for sorting
      return {
        city,
        sortableImage: {
          id: city.id,
          uploadedAt: typeof city.uploadedAt === 'string' ? city.uploadedAt : city.uploadedAt?.toISOString() || new Date().toISOString(),
          likeCount: city.likeCount || 0,
          viewCount: city.viewCount || 0
        }
      };
    }
  });

  // Sort ALL cities together
  const sortedImages = sortImages(citiesForSorting.map(item => item.sortableImage), currentSort);
  const finalSortedCities = sortedImages.map(sortedImage => {
    return citiesForSorting.find(item => item.sortableImage.id === sortedImage.id)?.city;
  }).filter(Boolean) as City[];

  // 5. Calculate pagination
  const actualTotalItems = finalSortedCities.length;
  const actualTotalPages = Math.ceil(actualTotalItems / itemsPerPage);
  const currentPageNum = Math.min(page, actualTotalPages || 1);
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayCities = finalSortedCities.slice(startIndex, endIndex);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <ImageFilterToggle
          showOnlyWithImages={showOnlyWithImages}
          onToggle={handleToggleImages}
          citiesWithImages={citiesWithImages}
          totalCities={actualTotalItems}
        />
        
        {cappedCities.filter(city => city.images && city.images.length > 0).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort images:</span>
            <ImageSortSelector
              currentSort={currentSort}
              onSortChange={handleSortChange}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayCities.map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
      
      {/* Pagination */}
      {actualTotalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPageNum - 1))}
            disabled={currentPageNum === 1}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPageNum === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, actualTotalPages) }, (_, i) => {
            let pageNumber: number;
            if (actualTotalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPageNum <= 3) {
              pageNumber = i + 1;
            } else if (currentPageNum >= actualTotalPages - 2) {
              pageNumber = actualTotalPages - 4 + i;
            } else {
              pageNumber = currentPageNum - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPageNum === pageNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(Math.min(actualTotalPages, currentPageNum + 1))}
            disabled={currentPageNum === actualTotalPages}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPageNum === actualTotalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, actualTotalItems)} of {actualTotalItems} cities
      </div>
    </>
  );
} 