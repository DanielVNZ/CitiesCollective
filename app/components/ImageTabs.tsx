'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  isContentCreator?: boolean;
}

export function ImageTabs({ 
  cityId, 
  images, 
  hallOfFameImages, 
  hofCreatorId, 
  cityName, 
  isOwner, 
  isFeaturedOnHomePage,
  isContentCreator = false
}: ImageTabsProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Show Hall of Fame first if available, otherwise Screenshots
    return hallOfFameImages.length > 0 ? 'hof' : 'screenshots';
  });
  const searchParams = useSearchParams();
  const hasHandledDeepLink = useRef(false);

  const hasScreenshots = images.length > 0;
  const hasHallOfFame = hallOfFameImages.length > 0;

  // Handle deep link navigation from URL parameters
  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    const imageId = searchParams.get('image');
    const imageType = searchParams.get('type');
    const commentId = searchParams.get('comment');

    if (imageId && imageType) {
      // Switch to the correct tab based on image type
      if (imageType === 'hall_of_fame' && hasHallOfFame) {
        setActiveTab('hof');
      } else if (imageType === 'screenshot' && hasScreenshots) {
        setActiveTab('screenshots');
      }
      
      hasHandledDeepLink.current = true;
    }
  }, [searchParams, hasHallOfFame, hasScreenshots]);

  // If only one type of images exists, don't show tabs
  if (hasScreenshots && !hasHallOfFame) {
    return (
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${
        isContentCreator 
          ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="p-6">
          <h2 className={`text-2xl font-bold mb-4 ${
            isContentCreator 
              ? 'text-purple-900 dark:text-purple-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {isContentCreator ? '📸 Creator Screenshots' : 'Screenshots'}
          </h2>
          <ImageSection 
            cityId={cityId} 
            initialImages={images} 
            isOwner={isOwner}
            deepLinkImageId={searchParams.get('image')}
            deepLinkImageType={searchParams.get('type')}
            deepLinkCommentId={searchParams.get('comment')}
          />
        </div>
      </div>
    );
  }

  if (hasHallOfFame && !hasScreenshots) {
    return (
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${
        isContentCreator 
          ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="p-6">
          <h2 className={`text-2xl font-bold mb-4 ${
            isContentCreator 
              ? 'text-purple-900 dark:text-purple-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {isContentCreator ? '🏆 Creator Hall of Fame' : 'Hall of Fame'}
          </h2>
          <CityHallOfFameImages 
            cityName={cityName} 
            hofCreatorId={hofCreatorId} 
            cityId={cityId}
            isOwner={isOwner}
            isFeaturedOnHomePage={isFeaturedOnHomePage}
            deepLinkImageId={searchParams.get('image')}
            deepLinkImageType={searchParams.get('type')}
            deepLinkCommentId={searchParams.get('comment')}
          />
        </div>
      </div>
    );
  }

  // If both exist, show tabs
  if (hasScreenshots && hasHallOfFame) {
    return (
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${
        isContentCreator 
          ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="p-6">
          <h2 className={`text-2xl font-bold mb-6 ${
            isContentCreator 
              ? 'text-purple-900 dark:text-purple-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {isContentCreator ? '🖼️ Creator City Images' : 'City Images'}
          </h2>
          
          {/* Tab Navigation */}
          <div className={`flex space-x-1 mb-6 rounded-lg p-1 ${
            isContentCreator 
              ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <button
              onClick={() => setActiveTab('hof')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'hof'
                  ? isContentCreator
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : isContentCreator
                    ? 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isContentCreator ? '🏆 Creator Hall of Fame' : 'Hall of Fame'}
            </button>
            <button
              onClick={() => setActiveTab('screenshots')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'screenshots'
                  ? isContentCreator
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : isContentCreator
                    ? 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isContentCreator ? '📸 Creator Screenshots' : 'Screenshots'}
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
                deepLinkImageId={searchParams.get('image')}
                deepLinkImageType={searchParams.get('type')}
                deepLinkCommentId={searchParams.get('comment')}
              />
            )}
            {activeTab === 'screenshots' && (
              <ImageSection 
                cityId={cityId} 
                initialImages={images} 
                isOwner={isOwner}
                deepLinkImageId={searchParams.get('image')}
                deepLinkImageType={searchParams.get('type')}
                deepLinkCommentId={searchParams.get('comment')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no images at all, don't render anything
  return null;
} 