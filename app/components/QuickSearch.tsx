'use client';

import { useState } from 'react';
import Link from 'next/link';

export function QuickSearch() {
  const [query, setQuery] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (query.trim()) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      }
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      window.location.href = `/search?query=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Find Your Perfect City
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search cities by name, map, or theme..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
            <Link
              href="/search"
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium text-center"
            >
              Advanced
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 