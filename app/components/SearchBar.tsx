'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterOptions {
  themes: string[];
  gameModes: string[];
  sortOptions: { value: string; label: string }[];
}

export function SearchBar() {
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

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getFilterOptions' })
        });
        if (response.ok) setFilterOptions(await response.json());
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
      minPopulation: minPopulation || undefined,
      maxPopulation: maxPopulation || undefined,
      minMoney: minMoney || undefined,
      maxMoney: maxMoney || undefined,
    };
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined));
    router.push(`/search?${new URLSearchParams(cleanFilters as any).toString()}`);
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
    router.push('/search');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by city, map, or creator name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-12 pl-11 pr-4 py-2 text-base bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="w-full lg:w-auto flex-1 bg-blue-600 text-white font-semibold px-6 h-12 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            Search
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full lg:w-auto flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-6 h-12 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{showAdvanced ? 'Less' : 'More'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Selects */}
            <FilterSelect label="Theme" value={theme} onChange={setTheme} options={filterOptions.themes} placeholder="All Themes" />
            <FilterSelect label="Game Mode" value={gameMode} onChange={setGameMode} options={filterOptions.gameModes} placeholder="All Modes" />
            <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={filterOptions.sortOptions.map(o => ({ value: o.value, label: o.label }))} />
            <FilterSelect label="Order" value={sortOrder} onChange={setSortOrder} options={[{ value: 'desc', label: 'High to Low' }, { value: 'asc', label: 'Low to High' }]} />
            
            {/* Range Filters */}
            <RangeInput label="Population" min={minPopulation} setMin={setMinPopulation} max={maxPopulation} setMax={setMaxPopulation} />
            <RangeInput label="Money ($)" min={minMoney} setMin={setMinMoney} max={maxMoney} setMax={setMaxMoney} />
          </div>

          <div className="flex justify-between items-center mt-8">
            <button onClick={handleClear} className="text-sm font-medium text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
              Clear All Filters
            </button>
            <button onClick={handleSearch} className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components for filters to keep the main component clean
function FilterSelect({ label, value, onChange, options, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt: any) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeInput({ label, min, setMin, max, setMax }: any) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} className="w-full h-11 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all" />
        <span className="text-gray-500 dark:text-gray-400">to</span>
        <input type="number" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} className="w-full h-11 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all" />
      </div>
    </div>
  );
} 