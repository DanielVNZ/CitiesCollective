'use client';

import { useState } from 'react';

export type ImageSortOption = 
  | 'most-recent'
  | 'most-liked'
  | 'most-likes-per-day'
  | 'best-like-view-ratio'
  | 'most-views-per-day'
  | 'most-viewed';

interface ImageSortSelectorProps {
  currentSort: ImageSortOption;
  onSortChange: (sort: ImageSortOption) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sortOptions = [
  {
    value: 'most-recent' as const,
    label: 'Most Recent',
    icon: '🕒',
    description: 'Newest first'
  },
  {
    value: 'most-liked' as const,
    label: 'Most Liked',
    icon: '❤️',
    description: 'Highest total likes'
  },
  {
    value: 'most-likes-per-day' as const,
    label: 'Likes/Day',
    icon: '📈',
    description: 'Likes per day'
  },
  {
    value: 'best-like-view-ratio' as const,
    label: 'Like/View %',
    icon: '📊',
    description: 'Best engagement rate'
  },
  {
    value: 'most-views-per-day' as const,
    label: 'Views/Day',
    icon: '👁️',
    description: 'Views per day'
  },
  {
    value: 'most-viewed' as const,
    label: 'Most Viewed',
    icon: '🔥',
    description: 'Highest total views'
  }
];

export default function ImageSortSelector({ 
  currentSort, 
  onSortChange, 
  className = '',
  size = 'md'
}: ImageSortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = sortOptions.find(option => option.value === currentSort);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2'
  };

  const dropdownSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
          rounded-lg shadow-sm hover:shadow-md transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${sizeClasses[size]}
        `}
      >
        <span className="text-lg">{currentOption?.icon}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {currentOption?.label}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                    transition-colors duration-150 ${dropdownSizeClasses[size]}
                    ${currentSort === option.value 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className={`text-gray-500 dark:text-gray-400 ${
                      size === 'sm' ? 'text-xs' : 'text-xs'
                    }`}>
                      {option.description}
                    </div>
                  </div>
                  {currentSort === option.value && (
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 