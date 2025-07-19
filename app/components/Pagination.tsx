'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  offset: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, offset }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    
    // Use replaceState to update URL without causing navigation
    window.history.replaceState({}, '', `/?${params.toString()}`);
    
    // Force a client-side navigation without scroll
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  if (totalPages <= 1) return null;

  return (
    <>
      <div className="mt-12 flex justify-center items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
          }`}
        >
          Previous
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === pageNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {pageNumber}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
          }`}
        >
          Next
        </button>
      </div>

      {/* Page Info */}
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Showing {offset + 1} to {Math.min(offset + itemsPerPage, totalItems)} of {totalItems} cities
      </div>
    </>
  );
} 