'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickSearch() {
  const [query, setQuery] = useState('');
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
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg overflow-hidden border-2 border-transparent focus-within:border-blue-500 transition-all duration-300">
        <div className="pl-5 pr-2 text-gray-400 dark:text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search city, creator, map..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full h-14 px-4 py-2 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white font-semibold px-6 h-14 hover:bg-blue-700 transition-colors duration-300"
        >
          Search
        </button>
      </div>
    </div>
  );
} 