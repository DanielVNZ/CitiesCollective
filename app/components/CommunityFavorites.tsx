'use client';

import { useState } from 'react';
import { CityCard } from './CityCard';

interface CommunityFavoritesProps {
  cities: Array<{
    id: number;
    cityName: string | null;
    mapName: string | null;
    population: number | null;
    money: number | null;
    xp: number | null;
    unlimitedMoney: boolean | null;
    uploadedAt: Date | null;
    likeCount: number;
    user: {
      id: number;
      username: string | null;
    } | null;
    images: Array<{
      id: number;
      fileName: string;
      isPrimary: boolean;
      mediumPath: string;
      largePath: string;
      thumbnailPath: string;
    }>;
    commentCount: number;
  }>;
}

export function CommunityFavorites({ cities }: CommunityFavoritesProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (cities.length === 0) return null;
  
  const displayedCities = showAll ? cities : cities.slice(0, 3);
  const hasMore = cities.length > 3;

  return (
    <section className="mb-16 sm:mb-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Community Favorites
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          The most beloved cities, ranked by the community.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          City must have images to be displayed here.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedCities.map((city, index) => (
          <CityCard key={city.id} city={city} ranking={index + 1} hideCreatorBadge={true} />
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showAll ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Show All {cities.length} Cities
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
} 