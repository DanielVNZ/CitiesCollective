'use client';

import Link from 'next/link';
import { memo, useMemo } from 'react';
import { LikeButton } from './LikeButton';
import { FavoriteButton } from './FavoriteButton';
import { CommentCount } from './CommentCount';
import { ViewCounter } from './ViewCounter';
import { ImageGallery } from './ImageGallery';
import { getUsernameTextColor, getUsernameAvatarColor, getUsernameRingColor } from '../utils/userColors';

// Helper function to format large numbers
const formatNumber = (num: number | null) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

// Helper function to format dates
const formatDate = (date: Date | null) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

interface CityCardProps {
  city: {
    id: number;
    cityName: string | null;
    mapName: string | null;
    population: number | null;
    money: number | null;
    xp: number | null;
    unlimitedMoney: boolean | null;
    uploadedAt: Date | null;
    viewCount?: number;
    commentCount: number;
    userId?: number | null;
    user?: {
      id: number;
      username: string | null;
      isContentCreator?: boolean | null;
    } | null;
    images?: Array<{
      id: number;
      fileName: string;
      isPrimary: boolean;
      mediumPath: string;
      largePath: string;
      thumbnailPath: string;
      isHallOfFame?: boolean;
    }> | null;
  };
  ranking?: number;
  hideCreatorBadge?: boolean;
}

export const CityCard = memo(function CityCard({ city, ranking, hideCreatorBadge = false }: CityCardProps) {
  // Memoize expensive calculations
  const userInfo = useMemo(() => {
    const username = city.user?.username;
    const isContentCreator = city.user?.isContentCreator;
    return {
      username,
      isContentCreator,
      usernameTextColor: getUsernameTextColor(username),
      usernameAvatarColor: getUsernameAvatarColor(username),
      usernameRingColor: getUsernameRingColor(username),
    };
  }, [city.user?.username, city.user?.isContentCreator]);

  // Memoize formatted values
  const formattedValues = useMemo(() => ({
    population: formatNumber(city.population),
    money: city.unlimitedMoney ? '∞' : formatNumber(city.money),
    xp: formatNumber(city.xp),
    uploadDate: formatDate(city.uploadedAt),
  }), [city.population, city.money, city.unlimitedMoney, city.xp, city.uploadedAt]);
  
  // Check if city has images for gallery
  const hasImages = city.images && Array.isArray(city.images) && city.images.length > 0;
  
  const { username, isContentCreator, usernameTextColor, usernameAvatarColor, usernameRingColor } = userInfo;

  return (
    <article 
      className={`group relative flex flex-col h-full overflow-hidden card-hover-lift city-card-enter city-card-focus focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 ${isContentCreator
        ? 'bg-gradient-to-br from-purple-50/90 via-pink-50/80 to-indigo-50/90 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-indigo-900/30 border-2 border-transparent bg-clip-padding shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 dark:hover:shadow-purple-500/20 rounded-xl relative creator-glow before:absolute before:inset-0 before:p-[2px] before:gradient-border-animated before:rounded-xl before:-z-10 focus-within:ring-purple-500'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl hover:shadow-gray-500/10 dark:hover:shadow-gray-900/20 rounded-xl'
      }`}
      role="article"
      aria-label={`City card for ${city.cityName || 'Unnamed City'} by ${city.user?.username || 'Anonymous'}`}
    >
      {ranking && (
        <div 
          className={`absolute top-0 left-0 text-white font-bold text-lg w-14 h-14 flex items-center justify-center rounded-br-2xl z-10 shadow-xl ${isContentCreator
            ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-2xl shadow-purple-500/50 animate-pulse'
            : 'bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg'
          }`}
          aria-label={`Ranked #${ranking}`}
          role="img"
        >
          #{ranking}
        </div>
      )}
      <div className="relative overflow-hidden rounded-t-xl">
        {hasImages ? (
          <div className="relative">
            <ImageGallery 
              images={city.images || []} 
              cityName={city.cityName || 'Unnamed City'} 
              isContentCreator={isContentCreator || false}
            />
            {/* Invisible link overlay for accessibility - covers the image but not the controls */}
            <Link 
              href={`/city/${city.id}`} 
              className="absolute inset-0 z-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-xl"
              aria-label={`View details for ${city.cityName || 'Unnamed City'}`}
            />
          </div>
        ) : (
          <Link 
            href={`/city/${city.id}`} 
            className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-xl"
            aria-label={`View details for ${city.cityName || 'Unnamed City'}`}
          >
            <div className="relative w-full h-48">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 text-white select-none">
                <span className="text-4xl mb-2" role="img" aria-label="City icon">🏙️</span>
                <span className="text-sm text-center">This city is so mysterious,<br />no pictures to see here!</span>
              </div>
            </div>
          </Link>
        )}

        {/* Enhanced Content Creator Badge */}
        {isContentCreator && !hideCreatorBadge && (
          <div className="absolute top-4 left-4 z-20">
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl border-2 border-white/30 backdrop-blur-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-extrabold tracking-wide">CREATOR</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-full blur-md opacity-50 -z-10 animate-pulse"></div>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-2">
          <LikeButton cityId={city.id} size="sm" />
          <FavoriteButton cityId={city.id} size="sm" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-15">
          <Link href={`/city/${city.id}`}>
            <h3 className={`text-xl font-bold text-white transition-colors mb-1 drop-shadow-lg ${isContentCreator 
              ? 'group-hover:text-purple-300 creator-float' 
              : 'group-hover:text-blue-300'
            }`}>
              {city.cityName || 'Unnamed City'}
            </h3>
            <p className="text-sm text-gray-200 drop-shadow-md">{city.mapName || 'Unknown Map'}</p>
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="flex-grow">
          {city.user && (
            <Link 
              href={`/user/${city.userId}`} 
              className="inline-flex items-center gap-3 mb-4 sm:mb-5 group/user focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg p-1 -m-1"
              aria-label={`View profile of ${city.user.username || 'Anonymous'}`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${usernameAvatarColor} flex items-center justify-center text-sm font-bold text-white ring-2 ring-transparent group-hover/user:${usernameRingColor} transition-all duration-300 ${isContentCreator ? 'ring-purple-300 dark:ring-purple-600 shadow-lg' : 'shadow-md'
                  }`}>
                  {city.user.username?.charAt(0).toUpperCase() || '?'}
                </div>
                {isContentCreator && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full border border-white dark:border-gray-800"></div>
                )}
              </div>
              <span className={`text-base font-medium ${usernameTextColor} group-hover/user:${usernameTextColor} transition-colors duration-300 ${isContentCreator ? 'font-semibold' : ''
                }`}>
                {city.user.username || 'Anonymous'}
                {isContentCreator && <span className="ml-1 text-purple-600 dark:text-purple-400">🎬</span>}
              </span>
            </Link>
          )}

          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            <div className="group/stat">
              <div 
                className={`flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg transition-all duration-300 ${isContentCreator ? 'bg-purple-50/50 dark:bg-purple-900/20 group-hover/stat:bg-purple-100/70 dark:group-hover/stat:bg-purple-900/30' : 'bg-gray-50 dark:bg-gray-700/50 group-hover/stat:bg-gray-100 dark:group-hover/stat:bg-gray-700'
                }`}
                role="img"
                aria-label={`Population: ${formattedValues.population}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-5 w-5 sm:h-6 sm:w-6 ${isContentCreator ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
                  }`} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span className={`text-base sm:text-lg font-bold ${isContentCreator ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                  }`}>{formattedValues.population}</span>
              </div>
            </div>
            <div className="group/stat">
              <div 
                className={`flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg transition-all duration-300 ${isContentCreator ? 'bg-pink-50/50 dark:bg-pink-900/20 group-hover/stat:bg-pink-100/70 dark:group-hover/stat:bg-pink-900/30' : 'bg-gray-50 dark:bg-gray-700/50 group-hover/stat:bg-gray-100 dark:group-hover/stat:bg-gray-700'
                }`}
                role="img"
                aria-label={`City funds: ${city.unlimitedMoney ? 'Unlimited' : formattedValues.money}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-5 w-5 sm:h-6 sm:w-6 ${isContentCreator ? 'text-pink-600 dark:text-pink-400' : 'text-green-600 dark:text-green-400'
                  }`} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className={`text-base sm:text-lg font-bold ${isContentCreator ? 'text-pink-900 dark:text-pink-100' : 'text-gray-900 dark:text-white'
                  }`}>{formattedValues.money}</span>
              </div>
            </div>
            <div className="group/stat">
              <div 
                className={`flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg transition-all duration-300 ${isContentCreator ? 'bg-indigo-50/50 dark:bg-indigo-900/20 group-hover/stat:bg-indigo-100/70 dark:group-hover/stat:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-700/50 group-hover/stat:bg-gray-100 dark:group-hover/stat:bg-gray-700'
                }`}
                role="img"
                aria-label={`Experience points: ${formattedValues.xp}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-6 sm:w-6 ${isContentCreator ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'
                  }`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                <span className={`text-base sm:text-lg font-bold ${isContentCreator ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                  }`}>{formattedValues.xp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 pt-5 border-t space-y-4 ${isContentCreator
          ? 'border-purple-200/60 dark:border-purple-700/60'
          : 'border-gray-200 dark:border-gray-700'
          }`}>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{formattedValues.uploadDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <CommentCount cityId={city.id} initialCount={city.commentCount} />
              <ViewCounter cityId={city.id} initialViewCount={city.viewCount} isContentCreator={isContentCreator || false} trackView={false} compact={true} />
            </div>
          </div>
          <Link 
            href={`/city/${city.id}`} 
            className={`block w-full text-center font-semibold py-3 sm:py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${isContentCreator
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 focus:ring-purple-500'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500'
            } !text-white`}
            aria-label={`View full details for ${city.cityName || 'Unnamed City'}`}
          >
            {isContentCreator ? '🌟 View Creator City' : 'View City'}
          </Link>
        </div>
      </div>
    </article>
  );
});