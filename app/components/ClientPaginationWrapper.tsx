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
      {/* Enhanced Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <ImageFilterToggle
          showOnlyWithImages={showOnlyWithImages}
          onToggle={handleToggleImages}
          citiesWithImages={citiesWithImages}
          totalCities={actualTotalItems}
        />
        
        {cappedCities.filter(city => city.images && city.images.length > 0).length > 0 && (
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort cities:</span>
            <ImageSortSelector
              currentSort={currentSort}
              onSortChange={handleSortChange}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Enhanced Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {displayCities.map((city, index) => (
          <div 
            key={city.id}
            className="animate-scale-in image-container"
            style={{ 
              animationDelay: `${index * 50}ms`,
              contentVisibility: 'auto',
              containIntrinsicSize: '300px 400px'
            }}
          >
            <CityCard city={city} />
          </div>
        ))}
      </div>
      
      {/* Enhanced Pagination */}
      {actualTotalPages > 1 && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPageNum - 1))}
              disabled={currentPageNum === 1}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                currentPageNum === 1
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:shadow-md'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-1 mx-4">
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
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      currentPageNum === pageNumber
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(actualTotalPages, currentPageNum + 1))}
              disabled={currentPageNum === actualTotalPages}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                currentPageNum === actualTotalPages
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:shadow-md'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Enhanced Page Info */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
            Showing <span className="font-medium text-gray-900 dark:text-white">{startIndex + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(endIndex, actualTotalItems)}</span> of <span className="font-medium text-gray-900 dark:text-white">{actualTotalItems}</span> cities
          </div>
        </div>
      )}
    </>
  );
} 