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
    viewCount?: number;
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
    <section className="section-modern animate-fade-in">
      {/* Enhanced section header with modern typography */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Community Favorites
          </h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-2">
          The most beloved cities, ranked by the community.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          City must have images to be displayed here.
        </p>
      </div>
      
      {/* Enhanced grid with better spacing and animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {displayedCities.map((city, index) => (
          <div 
            key={city.id} 
            className="animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CityCard city={city} ranking={index + 1} hideCreatorBadge={true} />
          </div>
        ))}
      </div>
      
      {/* Enhanced show more button with modern styling */}
      {hasMore && (
        <div className="text-center animate-fade-in">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              {showAll ? (
                <>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Show Less
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show All {cities.length} Cities
                </>
              )}
            </span>
          </button>
        </div>
      )}
    </section>
  );
} 