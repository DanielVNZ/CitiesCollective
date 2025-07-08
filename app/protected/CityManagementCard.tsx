'use client';

import { useState } from 'react';
import Link from 'next/link';

interface City {
  id: number;
  cityName: string;
  mapName: string;
  population: number;
  money: number;
  xp: number;
  theme: string;
  gameMode: string;
  uploadedAt: Date | null;
  fileName: string;
  modsEnabled?: string[] | null;
}

interface CityManagementCardProps {
  city: City;
}

export function CityManagementCard({ city }: CityManagementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    if (!date) return 'Unknown';
    // Use consistent date formatting to avoid hydration errors
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cities/${city.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to update the city list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to delete city: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to delete city. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/city/${city.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* City Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{city.cityName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{city.mapName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
              {city.theme}
            </span>
            {city.modsEnabled && city.modsEnabled.length > 0 ? (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">
                Modded
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                Vanilla
              </span>
            )}
          </div>
        </div>

        {/* City Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              {formatNumber(city.population)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Population</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              ${formatNumber(city.money)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Money</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              {formatNumber(city.xp)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
          </div>
        </div>

        {/* File Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="mb-1">
              <span className="font-medium">File:</span> {city.fileName}
            </div>
            <div className="mb-1">
              <span className="font-medium">Game Mode:</span> {city.gameMode}
            </div>
            <div>
              <span className="font-medium">Uploaded:</span> {formatDate(city.uploadedAt)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Link
              href={`/city/${city.id}`}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
            >
              View Details
            </Link>
            <button
              onClick={copyShareLink}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Share Link
            </button>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/city/${city.id}/update`}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-center text-sm font-medium"
            >
              Update City
            </Link>
          </div>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showDeleteConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isDeleting
              ? 'Deleting...'
              : showDeleteConfirm
              ? 'Confirm Delete'
              : 'Delete City'
            }
          </button>
          
          {showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full px-4 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 