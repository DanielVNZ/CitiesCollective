'use client';

import { useState } from 'react';
import { ImageSection } from 'app/city/[id]/ImageSection';
import CityHallOfFameImages from 'app/components/CityHallOfFameImages';

interface ImageTabsProps {
  cityId: number;
  images: any[];
  hallOfFameImages: any[];
  hofCreatorId: string | null;
  cityName: string;
  isOwner: boolean;
  isFeaturedOnHomePage: boolean;
}

export function ImageTabs({ 
  cityId, 
  images, 
  hallOfFameImages, 
  hofCreatorId, 
  cityName, 
  isOwner, 
  isFeaturedOnHomePage 
}: ImageTabsProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Show Hall of Fame first if available, otherwise Screenshots
    return hallOfFameImages.length > 0 ? 'hof' : 'screenshots';
  });

  const hasScreenshots = images.length > 0;
  const hasHallOfFame = hallOfFameImages.length > 0;

  // If only one type of images exists, don't show tabs
  if (hasScreenshots && !hasHallOfFame) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Screenshots</h2>
          <ImageSection cityId={cityId} initialImages={images} isOwner={isOwner} />
        </div>
      </div>
    );
  }

  if (hasHallOfFame && !hasScreenshots) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Hall of Fame</h2>
          <CityHallOfFameImages 
            cityName={cityName} 
            hofCreatorId={hofCreatorId} 
            cityId={cityId}
            isOwner={isOwner}
            isFeaturedOnHomePage={isFeaturedOnHomePage}
          />
        </div>
      </div>
    );
  }

  // If both exist, show tabs
  if (hasScreenshots && hasHallOfFame) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">City Images</h2>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('hof')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'hof'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Hall of Fame
            </button>
            <button
              onClick={() => setActiveTab('screenshots')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'screenshots'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Screenshots
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'hof' && (
              <CityHallOfFameImages 
                cityName={cityName} 
                hofCreatorId={hofCreatorId} 
                cityId={cityId}
                isOwner={isOwner}
                isFeaturedOnHomePage={isFeaturedOnHomePage}
              />
            )}
            {activeTab === 'screenshots' && (
              <ImageSection cityId={cityId} initialImages={images} isOwner={isOwner} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no images at all, don't render anything
  return null;
} 