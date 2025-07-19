'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from './LikeButton';
import { FavoriteButton } from './FavoriteButton';
import { CommentCount } from './CommentCount';
import { ViewCounter } from './ViewCounter';
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

export function CityCard({ city, ranking, hideCreatorBadge = false }: { city: any; ranking?: number; hideCreatorBadge?: boolean }) {
  // Find primary image, prioritizing Hall of Fame images if they exist
  const primaryImage = city.images?.find((img: any) => img.isPrimary) || city.images?.[0];
  const imagePath = primaryImage?.mediumPath || primaryImage?.largePath || primaryImage?.thumbnailPath || '/placeholder-image.png';
  const isPlaceholder = !imagePath || imagePath.includes('placeholder-image.png') || !primaryImage;
  const isHallOfFameImage = primaryImage?.isHallOfFame;
  const username = city.user?.username;
  const isContentCreator = city.user?.isContentCreator;
  const usernameTextColor = getUsernameTextColor(username);
  const usernameAvatarColor = getUsernameAvatarColor(username);
  const usernameRingColor = getUsernameRingColor(username);

  return (
    <div className={`group relative flex flex-col h-full rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border overflow-hidden transform hover:-translate-y-1 ${
      isContentCreator 
        ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-2xl' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {ranking && (
        <div className={`absolute top-0 left-0 text-white font-bold text-lg w-12 h-12 flex items-center justify-center rounded-br-2xl z-10 shadow-lg ${
          isContentCreator 
            ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-xl' 
            : 'bg-gradient-to-r from-purple-600 to-blue-500'
        }`}>
          #{ranking}
        </div>
      )}
      <div className="relative">
        <Link href={`/city/${city.id}`} className="block">
          <div className="relative w-full h-48">
            {isPlaceholder ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 text-white select-none" style={{height: '100%'}}>
                <span className="text-4xl mb-2">🏙️</span>
                <span className="text-sm text-center">This city is so mysterious,<br/>no pictures to see here!</span>
              </div>
            ) : (
              <Image
                src={imagePath}
                alt={`Image of ${city.cityName}`}
                fill
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-300"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
            
            {/* Hall of Fame Icon */}
            {isHallOfFameImage && (
              <div className="absolute bottom-4 right-4 z-10">
                <div className="bg-yellow-400 rounded-full p-1 shadow-lg">
                  <Image
                    src="/logo/hof-icon.svg"
                    alt="Hall of Fame"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            )}
            
            {/* Content Creator Badge */}
            {isContentCreator && !hideCreatorBadge && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white/20">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    CREATOR
                  </div>
                </div>
              </div>
            )}
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
          <LikeButton cityId={city.id} size="sm" />
          <FavoriteButton cityId={city.id} size="sm" />
        </div>
        <div className="absolute bottom-4 left-4 z-10">
          <Link href={`/city/${city.id}`}>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
              {city.cityName || 'Unnamed City'}
            </h3>
            <p className="text-sm text-gray-200">{city.mapName || 'Unknown Map'}</p>
          </Link>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          {city.user && (
            <Link href={`/user/${city.userId}`} className="inline-flex items-center gap-2 mb-4 group/user">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${usernameAvatarColor} flex items-center justify-center text-sm font-bold text-white ring-2 ring-transparent group-hover/user:${usernameRingColor} transition-all ${
                  isContentCreator ? 'ring-purple-300 dark:ring-purple-600 shadow-lg' : ''
                }`}>
                  {city.user.username?.charAt(0).toUpperCase() || '?'}
                </div>
                {isContentCreator && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full border border-white dark:border-gray-800"></div>
                )}
              </div>
              <span className={`text-sm font-medium ${usernameTextColor} group-hover/user:${usernameTextColor} transition-colors ${
                isContentCreator ? 'font-semibold' : ''
              }`}>
                {city.user.username || 'Anonymous'}
                {isContentCreator && <span className="ml-1 text-purple-600 dark:text-purple-400">🎬</span>}
              </span>
            </Link>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div title="Population">
              <div className={`flex items-center justify-center gap-1 ${
                isContentCreator ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span className={`text-lg font-bold ${
                  isContentCreator ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                }`}>{formatNumber(city.population)}</span>
              </div>
            </div>
            <div title="City Funds">
               <div className={`flex items-center justify-center gap-1 ${
                 isContentCreator ? 'text-pink-600 dark:text-pink-400' : 'text-green-600 dark:text-green-400'
               }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className={`text-lg font-bold ${
                  isContentCreator ? 'text-pink-900 dark:text-pink-100' : 'text-gray-900 dark:text-white'
                }`}>{city.unlimitedMoney ? '∞' : formatNumber(city.money)}</span>
              </div>
            </div>
             <div title="Experience Points">
               <div className={`flex items-center justify-center gap-1 ${
                 isContentCreator ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'
               }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                <span className={`text-lg font-bold ${
                  isContentCreator ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                }`}>{formatNumber(city.xp)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`mt-6 pt-4 border-t space-y-4 ${
          isContentCreator 
            ? 'border-purple-200 dark:border-purple-700' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{formatDate(city.uploadedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CommentCount cityId={city.id} initialCount={city.commentCount} />
              <ViewCounter cityId={city.id} initialViewCount={city.viewCount} isContentCreator={isContentCreator} trackView={false} compact={true} />
            </div>
          </div>
          <Link href={`/city/${city.id}`} className={`block w-full text-center font-semibold py-2 rounded-lg transition-colors ${
            isContentCreator 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
            {isContentCreator ? '🌟 View Creator City' : 'View City'}
          </Link>
        </div>
      </div>
    </div>
  );
} 