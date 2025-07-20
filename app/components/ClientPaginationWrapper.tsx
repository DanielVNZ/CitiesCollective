'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CityCard } from 'app/components/CityCard';
import { ImageFilterToggle } from 'app/components/ImageFilterToggle';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(searchParams.get('withImages') === 'true');

  const navigateToPage = useCallback(async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || isLoading) return;
    
    setIsLoading(true);
    setPage(newPage);
    
    try {
      const newOffset = (newPage - 1) * itemsPerPage;
      const response = await fetch(`/api/cities/recent?limit=${itemsPerPage}&offset=${newOffset}&withImages=${showOnlyWithImages}`);
      
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      } else {
        console.error('Failed to fetch cities');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoading(false);
    }
    
    // Update URL without causing navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    if (showOnlyWithImages) {
      params.set('withImages', 'true');
    } else {
      params.delete('withImages');
    }
    window.history.replaceState({}, '', `/?${params.toString()}`);
  }, [page, totalPages, isLoading, itemsPerPage, searchParams, showOnlyWithImages]);

  // Update local state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlWithImages = searchParams.get('withImages') === 'true';
    
    // Only update page if different
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [searchParams, page]);

  const newOffset = (page - 1) * itemsPerPage;

  const handleToggleImages = useCallback(async (showOnly: boolean) => {
    // Update state immediately for visual feedback
    setShowOnlyWithImages(showOnly);
    setPage(1); // Reset to first page when filtering
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/cities/recent?limit=${itemsPerPage}&offset=0&withImages=${showOnly}`);
      
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      } else {
        console.error('Failed to fetch cities');
        // Revert state if fetch failed
        setShowOnlyWithImages(!showOnly);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Revert state if fetch failed
      setShowOnlyWithImages(!showOnly);
    } finally {
      setIsLoading(false);
    }
    
    // Update URL without causing navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (showOnly) {
      params.set('withImages', 'true');
    } else {
      params.delete('withImages');
    }
    window.history.replaceState({}, '', `/?${params.toString()}`);
  }, [itemsPerPage, searchParams]);

  // Filter cities based on toggle
  const filteredCities = showOnlyWithImages 
    ? cities.filter(city => city.images && city.images.length > 0)
    : cities;

  return (
    <>
      {/* Image Filter Toggle */}
      <ImageFilterToggle
        showOnlyWithImages={showOnlyWithImages}
        onToggle={handleToggleImages}
        citiesWithImages={citiesWithImages}
        totalCities={totalItems}
      />

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: itemsPerPage }, (_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          filteredCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => navigateToPage(page - 1)}
            disabled={page === 1 || isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              page === 1 || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {isLoading ? 'Loading...' : 'Previous'}
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber: number;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (page <= 3) {
              pageNumber = i + 1;
            } else if (page >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = page - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => navigateToPage(pageNumber)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  page === pageNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => navigateToPage(page + 1)}
            disabled={page === totalPages || isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              page === totalPages || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {isLoading ? 'Loading...' : 'Next'}
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Showing {newOffset + 1} to {Math.min(newOffset + itemsPerPage, totalItems)} of {totalItems} cities
      </div>
    </>
  );
} 