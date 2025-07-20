'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CityCard } from 'app/components/CityCard';
import Link from 'next/link';

interface SearchResult {
  cities: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: any;
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  if (loading) {
    return <SearchResultsLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <p className="text-gray-600 dark:text-gray-400">No results found</p>
      </div>
    );
  }

  const { cities, pagination, filters } = results;

  // Create active filters display
  const activeFilters = [];
  if (filters.query) activeFilters.push(`"${filters.query}"`);
  if (filters.theme) activeFilters.push(`Theme: ${filters.theme}`);
  if (filters.gameMode) activeFilters.push(`Mode: ${filters.gameMode}`);
  if (filters.contentCreator) activeFilters.push(`Creator: ${filters.contentCreator}`);
  if (filters.minPopulation) activeFilters.push(`Min Population: ${filters.minPopulation.toLocaleString()}`);
  if (filters.maxPopulation) activeFilters.push(`Max Population: ${filters.maxPopulation.toLocaleString()}`);
  if (filters.minMoney) activeFilters.push(`Min Money: $${filters.minMoney.toLocaleString()}`);
  if (filters.maxMoney) activeFilters.push(`Max Money: $${filters.maxMoney.toLocaleString()}`);
  if (filters.withImages) activeFilters.push(`Cities with images`);

  const generatePageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `/search?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {pagination.totalCount === 0 ? 'No cities found' : 
             `${pagination.totalCount} ${pagination.totalCount === 1 ? 'city' : 'cities'} found`}
          </h2>
          {activeFilters.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active filters:</p>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {pagination.totalCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
          </div>
        )}
      </div>

      {/* Results Grid */}
      {cities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏙️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No cities match your search
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or search terms to find more cities.
          </p>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {/* Previous Page */}
          {pagination.hasPreviousPage ? (
            <Link
              href={generatePageUrl(pagination.page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed">
              Previous
            </span>
          )}

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }

            const isCurrentPage = pageNum === pagination.page;
            
            return (
              <Link
                key={pageNum}
                href={generatePageUrl(pageNum)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isCurrentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}

          {/* Next Page */}
          {pagination.hasNextPage ? (
            <Link
              href={generatePageUrl(pagination.page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed">
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 