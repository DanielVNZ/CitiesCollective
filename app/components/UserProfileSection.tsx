'use client';

import { useState } from 'react';
import { UsernameEditor } from './UsernameEditor';
import Link from 'next/link';

interface UserProfileSectionProps {
  user: {
    id: number;
    email: string;
    username: string;
  };
  cities: any[];
  totalPopulation: number;
  totalMoney: number;
  lastUpload: Date | null;
}

export function UserProfileSection({ user, cities, totalPopulation, totalMoney, lastUpload }: UserProfileSectionProps) {
  const [currentUsername, setCurrentUsername] = useState(user.username);

  const formatNumber = (num: number) => {
    // For very large numbers, use abbreviations
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    
    return num.toLocaleString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    // Use consistent date formatting to avoid hydration errors
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full text-2xl font-bold">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div className="ml-6">
            <UsernameEditor
              currentUsername={currentUsername}
              onUsernameUpdate={setCurrentUsername}
            />
            <p className="text-gray-600 dark:text-gray-400 text-lg">{user.email}</p>
          </div>
        </div>
        <Link
          href="/upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-center md:text-left"
        >
          Upload New City
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{cities.length}</div>
          <div className="text-sm text-blue-600 dark:text-blue-300">Cities Shared</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatNumber(totalPopulation)}
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">Total Population</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-lg md:text-2xl font-bold text-yellow-700 dark:text-yellow-400 break-words">
            ${formatNumber(totalMoney)}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-300">Total Money</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">
            {formatDate(lastUpload)}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-300">Last Upload</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <Link
          href="/favorites"
          className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          View Favorites
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Explore Cities
        </Link>
      </div>
    </div>
  );
} 