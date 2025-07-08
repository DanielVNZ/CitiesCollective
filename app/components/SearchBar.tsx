'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterOptions {
  themes: string[];
  gameModes: string[];
  sortOptions: { value: string; label: string }[];
}

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export function SearchBar({ onSearch, className = '' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [theme, setTheme] = useState(searchParams.get('theme') || '');
  const [gameMode, setGameMode] = useState(searchParams.get('gameMode') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [minPopulation, setMinPopulation] = useState(searchParams.get('minPopulation') || '');
  const [maxPopulation, setMaxPopulation] = useState(searchParams.get('maxPopulation') || '');
  const [minMoney, setMinMoney] = useState(searchParams.get('minMoney') || '');
  const [maxMoney, setMaxMoney] = useState(searchParams.get('maxMoney') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    themes: [],
    gameModes: [],
    sortOptions: []
  });

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getFilterOptions' })
        });
        
        if (response.ok) {
          const options = await response.json();
          setFilterOptions(options);
        }
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);

  const handleSearch = () => {
    const filters = {
      query: query.trim() || undefined,
      theme: theme || undefined,
      gameMode: gameMode || undefined,
      sortBy,
      sortOrder,
      minPopulation: minPopulation ? parseInt(minPopulation) : undefined,
      maxPopulation: maxPopulation ? parseInt(maxPopulation) : undefined,
      minMoney: minMoney ? parseInt(minMoney) : undefined,
      maxMoney: maxMoney ? parseInt(maxMoney) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );

    // Update URL with search parameters
    const params = new URLSearchParams(cleanFilters as any);
    router.push(`/search?${params.toString()}`);
    
    // Call the onSearch callback if provided
    if (onSearch) {
      onSearch(cleanFilters);
    }
  };

  const handleClear = () => {
    setQuery('');
    setTheme('');
    setGameMode('');
    setSortBy('newest');
    setSortOrder('desc');
    setMinPopulation('');
    setMaxPopulation('');
    setMinMoney('');
    setMaxMoney('');
    setShowAdvanced(false);
    
    // Navigate to search page with no filters
    router.push('/search');
    
    if (onSearch) {
      onSearch({});
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search cities by name, map, or creator..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {showAdvanced ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme:</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Themes</option>
            {filterOptions.themes.map((themeOption) => (
              <option key={themeOption} value={themeOption}>
                {themeOption}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Modes</option>
            {filterOptions.gameModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            {filterOptions.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Population Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Population Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPopulation}
                  onChange={(e) => setMinPopulation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <span className="self-center text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPopulation}
                  onChange={(e) => setMaxPopulation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Money Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Money Range ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minMoney}
                  onChange={(e) => setMinMoney(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <span className="self-center text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxMoney}
                  onChange={(e) => setMaxMoney(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleClear}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
            >
              Clear All Filters
            </button>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 