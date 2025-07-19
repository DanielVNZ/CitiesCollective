'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface City {
  id: number;
  cityName: string;
  mapName: string;
  population: number;
  money: number;
  xp: number;
  unlimitedMoney: boolean;
  uploadedAt: Date | null;
  user: {
    id: number;
    username: string;
  };
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

interface ClientPaginationProps {
  initialCities: City[];
  totalCities: number;
  citiesPerPage: number;
  initialPage: number;
  totalPages: number;
}

export function ClientPagination({ 
  initialCities, 
  totalCities, 
  citiesPerPage, 
  initialPage, 
  totalPages 
}: ClientPaginationProps) {
  const [cities, setCities] = useState<City[]>(initialCities);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update URL when page changes (without causing refresh)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', currentPage.toString());
    const newUrl = `/?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentPage, searchParams]);

  const navigateToPage = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || isLoading) return;
    
    setIsLoading(true);
    setCurrentPage(page);
    
    try {
      const offset = (page - 1) * citiesPerPage;
      const response = await fetch(`/api/cities/recent?limit=${citiesPerPage}&offset=${offset}`);
      
      if (response.ok) {
        const newCities = await response.json();
        setCities(newCities.cities || []);
      } else {
        console.error('Failed to fetch cities');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const offset = (currentPage - 1) * citiesPerPage;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cities.map((city) => (
          <div key={city.id} className="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:-translate-y-1">
            {/* City card content - simplified version */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{city.cityName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{city.mapName}</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {city.population?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Population</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {city.unlimitedMoney ? '∞' : `$${city.money?.toLocaleString() || '0'}`}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Money</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {city.xp?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 1 || isLoading
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
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => navigateToPage(pageNumber)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === pageNumber
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
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === totalPages || isLoading
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
        Showing {offset + 1} to {Math.min(offset + citiesPerPage, totalCities)} of {totalCities} cities
      </div>
    </>
  );
} 