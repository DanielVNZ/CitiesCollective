'use client';

interface ImageFilterToggleProps {
  showOnlyWithImages: boolean;
  onToggle: (showOnlyWithImages: boolean) => void;
  citiesWithImages: number;
  totalCities: number;
}

export function ImageFilterToggle({ 
  showOnlyWithImages, 
  onToggle, 
  citiesWithImages, 
  totalCities 
}: ImageFilterToggleProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onToggle(!showOnlyWithImages)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${showOnlyWithImages 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${showOnlyWithImages ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
            <label 
              className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
            >
              Show only cities with images
            </label>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {showOnlyWithImages ? (
              <span>Showing {citiesWithImages} of {totalCities} cities</span>
            ) : (
              <span>Showing all {totalCities} cities</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 