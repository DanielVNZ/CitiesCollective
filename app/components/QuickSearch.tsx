'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto animate-fade-in">
      {/* Enhanced search container with modern styling */}
      <div className={`
        relative flex items-center overflow-hidden transition-all duration-300 ease-out
        bg-white dark:bg-gray-800/90 backdrop-blur-sm
        rounded-2xl shadow-lg hover:shadow-xl
        border-2 border-gray-200/50 dark:border-gray-700/50
        ${isFocused 
          ? 'border-blue-500/70 dark:border-blue-400/70 shadow-xl ring-4 ring-blue-500/10 dark:ring-blue-400/10' 
          : 'hover:border-gray-300/70 dark:hover:border-gray-600/70'
        }
      `}>
        {/* Search icon with enhanced styling */}
        <div className={`
          flex items-center justify-center pl-6 pr-3 transition-colors duration-300
          ${isFocused 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 transition-transform duration-300 hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Enhanced input field */}
        <input
          type="text"
          placeholder="Search cities, creators, maps..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            flex-1 h-16 px-4 py-3 text-lg font-medium
            bg-transparent border-none outline-none
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            transition-all duration-300
            min-w-0
          `}
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />

        {/* Clear button (appears when there's text) */}
        {query && (
          <button
            onClick={() => setQuery('')}
            className="
              flex items-center justify-center w-8 h-8 mr-2
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            "
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Enhanced search button */}
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className={`
            relative overflow-hidden px-8 h-16 font-semibold text-white
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-4 focus:ring-blue-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${query.trim()
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-400 dark:bg-gray-600'
            }
          `}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="hidden sm:inline">Search</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          
          {/* Subtle gradient overlay for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Search suggestions placeholder for future enhancement */}
      {isFocused && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 opacity-0 pointer-events-none">
          {/* Future: Search suggestions will go here */}
        </div>
      )}
    </div>
  );
} 